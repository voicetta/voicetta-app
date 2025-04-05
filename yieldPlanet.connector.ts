import { YieldPlanetService } from './yieldPlanet.service';
import { MiniCalConnector } from './miniCal.connector';
import { Property } from '../models/Property';
import { Reservation } from '../models/Reservation';
import { RequestLog } from '../models/RequestLog';
import { AppDataSource } from '../config/database';
import { 
  YieldPlanetRoom, 
  YieldPlanetRatePlan, 
  YieldPlanetReservation,
  YieldPlanetRate,
  YieldPlanetAvailability
} from '../models/yieldPlanet.models';
import { logger } from '../utils/logger';

/**
 * YieldPlanet Connector class that orchestrates communication between YieldPlanet Channel Manager and the middleware
 */
export class YieldPlanetConnector {
  private yieldPlanetService: YieldPlanetService;
  private miniCalConnector: MiniCalConnector;
  private propertyRepository = AppDataSource.getRepository(Property);
  private reservationRepository = AppDataSource.getRepository(Reservation);
  private requestLogRepository = AppDataSource.getRepository(RequestLog);

  /**
   * Creates a new YieldPlanet connector instance
   * @param yieldPlanetConfig Optional YieldPlanet configuration
   * @param miniCalConfig Optional MiniCal configuration
   */
  constructor(yieldPlanetConfig?: any, miniCalConfig?: any) {
    this.yieldPlanetService = new YieldPlanetService(yieldPlanetConfig);
    this.miniCalConnector = new MiniCalConnector(miniCalConfig);
  }

  /**
   * Fetches rooms from YieldPlanet
   * @param propertyId Property ID
   * @returns Promise with rooms
   */
  async fetchRooms(propertyId: string): Promise<YieldPlanetRoom[]> {
    try {
      const startTime = Date.now();
      
      // Fetch rooms from YieldPlanet
      const rooms = await this.yieldPlanetService.getRooms(propertyId);
      
      // Log the request
      await this.logRequest(
        'GET',
        `/properties/${propertyId}/rooms`,
        null,
        rooms,
        200,
        Date.now() - startTime,
        propertyId
      );
      
      return rooms;
    } catch (error: any) {
      // Log the error
      await this.logRequest(
        'GET',
        `/properties/${propertyId}/rooms`,
        null,
        null,
        error.response?.status || 500,
        0,
        propertyId,
        error.message
      );
      
      throw error;
    }
  }

  /**
   * Fetches rate plans from YieldPlanet
   * @param propertyId Property ID
   * @returns Promise with rate plans
   */
  async fetchRatePlans(propertyId: string): Promise<YieldPlanetRatePlan[]> {
    try {
      const startTime = Date.now();
      
      // Fetch rate plans from YieldPlanet
      const ratePlans = await this.yieldPlanetService.getRatePlans(propertyId);
      
      // Log the request
      await this.logRequest(
        'GET',
        `/properties/${propertyId}/rateplans`,
        null,
        ratePlans,
        200,
        Date.now() - startTime,
        propertyId
      );
      
      return ratePlans;
    } catch (error: any) {
      // Log the error
      await this.logRequest(
        'GET',
        `/properties/${propertyId}/rateplans`,
        null,
        null,
        error.response?.status || 500,
        0,
        propertyId,
        error.message
      );
      
      throw error;
    }
  }

  /**
   * Creates a reservation in YieldPlanet
   * @param reservation Reservation data
   * @returns Promise with created reservation
   */
  async createReservation(reservation: YieldPlanetReservation): Promise<YieldPlanetReservation> {
    try {
      const startTime = Date.now();
      
      // Create reservation in YieldPlanet
      const createdReservation = await this.yieldPlanetService.createReservation(reservation);
      
      // Store the reservation in the database
      const dbReservation = new Reservation();
      dbReservation.propertyId = reservation.propertyId;
      dbReservation.roomTypeId = reservation.roomId;
      dbReservation.guestName = reservation.guestName;
      dbReservation.guestEmail = reservation.guestEmail;
      dbReservation.checkInDate = new Date(reservation.checkIn);
      dbReservation.checkOutDate = new Date(reservation.checkOut);
      dbReservation.adults = reservation.adults;
      dbReservation.children = reservation.children;
      dbReservation.totalPrice = reservation.totalPrice;
      dbReservation.currency = reservation.currency;
      dbReservation.status = 'confirmed';
      dbReservation.yieldPlanetReservationId = createdReservation.id;
      
      await this.reservationRepository.save(dbReservation);
      
      // Log the request
      await this.logRequest(
        'POST',
        `/properties/${reservation.propertyId}/reservations`,
        reservation,
        createdReservation,
        200,
        Date.now() - startTime,
        reservation.propertyId
      );
      
      // Create the booking in MiniCal
      await this.miniCalConnector.createBookingFromYieldPlanet(createdReservation);
      
      return createdReservation;
    } catch (error: any) {
      // Log the error
      await this.logRequest(
        'POST',
        `/properties/${reservation.propertyId}/reservations`,
        reservation,
        null,
        error.response?.status || 500,
        0,
        reservation.propertyId,
        error.message
      );
      
      throw error;
    }
  }

  /**
   * Updates a reservation in YieldPlanet
   * @param reservationId Reservation ID
   * @param data Update data
   * @returns Promise with updated reservation
   */
  async updateReservation(
    reservationId: string,
    data: Partial<YieldPlanetReservation>
  ): Promise<YieldPlanetReservation> {
    try {
      const startTime = Date.now();
      
      // Update reservation in YieldPlanet
      const updatedReservation = await this.yieldPlanetService.updateReservation(reservationId, data);
      
      // Update the reservation in the database
      const dbReservation = await this.reservationRepository.findOneBy({ yieldPlanetReservationId: reservationId });
      
      if (dbReservation) {
        if (data.checkIn) dbReservation.checkInDate = new Date(data.checkIn);
        if (data.checkOut) dbReservation.checkOutDate = new Date(data.checkOut);
        if (data.adults) dbReservation.adults = data.adults;
        if (data.children) dbReservation.children = data.children;
        if (data.totalPrice) dbReservation.totalPrice = data.totalPrice;
        if (data.currency) dbReservation.currency = data.currency;
        if (data.status) dbReservation.status = data.status === 'confirmed' ? 'confirmed' : 
                                               data.status === 'cancelled' ? 'cancelled' : 'pending';
        
        await this.reservationRepository.save(dbReservation);
      }
      
      // Log the request
      await this.logRequest(
        'PUT',
        `/reservations/${reservationId}`,
        data,
        updatedReservation,
        200,
        Date.now() - startTime,
        updatedReservation.propertyId
      );
      
      // TODO: Update the booking in MiniCal
      // This would require additional implementation in the MiniCalConnector
      
      return updatedReservation;
    } catch (error: any) {
      // Log the error
      await this.logRequest(
        'PUT',
        `/reservations/${reservationId}`,
        data,
        null,
        error.response?.status || 500,
        0,
        null,
        error.message
      );
      
      throw error;
    }
  }

  /**
   * Cancels a reservation in YieldPlanet
   * @param reservationId Reservation ID
   * @returns Promise with cancellation result
   */
  async cancelReservation(reservationId: string): Promise<any> {
    try {
      const startTime = Date.now();
      
      // Get the reservation from the database
      const dbReservation = await this.reservationRepository.findOneBy({ yieldPlanetReservationId: reservationId });
      
      if (!dbReservation) {
        throw new Error(`Reservation with YieldPlanet ID ${reservationId} not found`);
      }
      
      // Cancel reservation in YieldPlanet
      const result = await this.yieldPlanetService.cancelReservation(reservationId);
      
      // Update the reservation status in the database
      dbReservation.status = 'cancelled';
      await this.reservationRepository.save(dbReservation);
      
      // Log the request
      await this.logRequest(
        'DELETE',
        `/reservations/${reservationId}`,
        null,
        result,
        200,
        Date.now() - startTime,
        dbReservation.propertyId
      );
      
      // TODO: Cancel the booking in MiniCal
      // This would require additional implementation in the MiniCalConnector
      
      return result;
    } catch (error: any) {
      // Log the error
      await this.logRequest(
        'DELETE',
        `/reservations/${reservationId}`,
        null,
        null,
        error.response?.status || 500,
        0,
        null,
        error.message
      );
      
      throw error;
    }
  }

  /**
   * Updates availability in YieldPlanet
   * @param propertyId Property ID
   * @param roomId Room ID
   * @param availabilityData Availability data
   * @returns Promise with update result
   */
  async updateAvailability(
    propertyId: string,
    roomId: string,
    availabilityData: YieldPlanetAvailability[]
  ): Promise<any> {
    try {
      const startTime = Date.now();
      
      // Update availability in YieldPlanet
      const result = await this.yieldPlanetService.updateAvailability(propertyId, roomId, availabilityData);
      
      // Log the request
      await this.logRequest(
        'PUT',
        `/properties/${propertyId}/rooms/${roomId}/availability`,
        availabilityData,
        result,
        200,
        Date.now() - startTime,
        propertyId
      );
      
      return result;
    } catch (error: any) {
      // Log the error
      await this.logRequest(
        'PUT',
        `/properties/${propertyId}/rooms/${roomId}/availability`,
        availabilityData,
        null,
        error.response?.status || 500,
        0,
        propertyId,
        error.message
      );
      
      throw error;
    }
  }

  /**
   * Updates rates in YieldPlanet
   * @param propertyId Property ID
   * @param roomId Room ID
   * @param ratePlanId Rate plan ID
   * @param rateData Rate data
   * @returns Promise with update result
   */
  async updateRates(
    propertyId: string,
    roomId: string,
    ratePlanId: string,
    rateData: YieldPlanetRate[]
  ): Promise<any> {
    try {
      const startTime = Date.now();
      
      // Update rates in YieldPlanet
      const result = await this.yieldPlanetService.updateRates(propertyId, roomId, ratePlanId, rateData);
      
      // Log the request
      await this.logRequest(
        'PUT',
        `/properties/${propertyId}/rooms/${roomId}/rateplans/${ratePlanId}/rates`,
        rateData,
        result,
        200,
        Date.now() - startTime,
        propertyId
      );
      
      return result;
    } catch (error: any) {
      // Log the error
      await this.logRequest(
        'PUT',
        `/properties/${propertyId}/rooms/${roomId}/rateplans/${ratePlanId}/rates`,
        rateData,
        null,
        error.response?.status || 500,
        0,
        propertyId,
        error.message
      );
      
      throw error;
    }
  }

  /**
   * Synchronizes inventory from MiniCal to YieldPlanet
   * @param propertyId Property ID
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   * @returns Promise with synchronization result
   */
  async syncInventoryFromMiniCal(propertyId: string, startDate: string, endDate: string): Promise<any> {
    try {
      // Get property from database
      const property = await this.propertyRepository.findOneBy({ id: propertyId });
      
      if (!property) {
        throw new Error(`Property with ID ${propertyId} not found`);
      }
      
      // Get availability from MiniCal
      const miniCalAvailability = await this.miniCalConnector.syncAvailabilityToYieldPlanet(
        property.yieldPlanetPropertyId,
        startDate,
        endDate
      );
      
      // Transform MiniCal availability to YieldPlanet format
      // This is a simplified implementation - in a real system, you would need to
      // map room types and handle the actual data transformation
      
      // For each room type, update availability in YieldPlanet
      const results = [];
      
      for (const roomType of property.roomTypes) {
        // Filter availability for this room type
        const roomAvailability = miniCalAvailability.filter(
          (item: any) => item.room_type_id === roomType.id
        );
        
        // Transform to YieldPlanet format
        const yieldPlanetAvailability: YieldPlanetAvailability[] = roomAvailability.map(
          (item: any) => ({
            date: item.date,
            roomId: this.yieldPlanetService.mapRoomId(item.room_type_id),
            allotment: item.availability,
            status: item.status
          })
        );
        
        // Update availability in YieldPlanet
        if (yieldPlanetAvailability.length > 0) {
          const result = await this.updateAvailability(
            property.yieldPlanetPropertyId,
            this.yieldPlanetService.mapRoomId(roomType.id),
            yieldPlanetAvailability
          );
          
          results.push(result);
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Error synchronizing inventory from MiniCal:', error);
      throw error;
    }
  }

  /**
   * Synchronizes rates from MiniCal to YieldPlanet
   * @param propertyId Property ID
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   * @returns Promise with synchronization result
   */
  async syncRatesFromMiniCal(propertyId: string, startDate: string, endDate: string): Promise<any> {
    try {
      // Get property from database
      const property = await this.propertyRepository.findOneBy({ id: propertyId });
      
      if (!property) {
        throw new Error(`Property with ID ${propertyId} not found`);
      }
      
      // Get rates from MiniCal
      const miniCalRates = await this.miniCalConnector.syncRatesToYieldPlanet(
        property.yieldPlanetPropertyId,
        startDate,
        endDate
      );
      
      // Transform MiniCal rates to YieldPlanet format
      // This is a simplified implementation - in a real system, you would need to
      // map room types and rate plans and handle the actual data transformation
      
      // For each rate plan, update rates in YieldPlanet
      const results = [];
      
      // Group rates by room type and rate plan
      const ratesByRoomAndPlan: Record<string, Record<string, any[]>> = {};
      
      for (const rate of miniCalRates) {
        if (!ratesByRoomAndPlan[rate.room_type_id]) {
          ratesByRoomAndPlan[rate.room_type_id] = {};
        }
        
        if (!ratesByRoomAndPlan[rate.room_type_id][rate.rate_plan_id]) {
          ratesByRoomAndPlan[rate.room_type_id][rate.rate_plan_id] = [];
        }
        
        ratesByRoomAndPlan[rate.room_type_id][rate.rate_plan_id].push(rate);
      }
      
      // Update rates for each room type and rate plan
      for (const roomTypeId in ratesByRoomAndPlan) {
        for (const ratePlanId in ratesByRoomAndPlan[roomTypeId]) {
          const rates = ratesByRoomAndPlan[roomTypeId][ratePlanId];
          
          // Transform to YieldPlanet format
          const yieldPlanetRates: YieldPlanetRate[] = rates.map(
            (item: any) => ({
              date: item.date,
              roomId: this.yieldPlanetService.mapRoomId(roomTypeId),
              ratePlanId: this.yieldPlanetService.mapRatePlanId(ratePlanId),
              price: item.rate,
              currency: item.currency,
              restrictions: {
                minStay: item.min_length_of_stay,
                m
(Content truncated due to size limit. Use line ranges to read in chunks)