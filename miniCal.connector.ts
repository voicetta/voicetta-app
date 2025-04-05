import { MiniCalService } from './miniCal.service';
import { MiniCalMapper } from './miniCal.mapper';
import { YieldPlanetService } from './yieldPlanet.service';
import { 
  MiniCalRoomType, 
  MiniCalRatePlan, 
  MiniCalBooking, 
  MiniCalProperty 
} from '../models/miniCal.models';
import { 
  YieldPlanetRoom, 
  YieldPlanetRatePlan, 
  YieldPlanetReservation 
} from '../models/yieldPlanet.models';
import { Property } from '../models/Property';
import { Reservation } from '../models/Reservation';
import { RequestLog } from '../models/RequestLog';
import { AppDataSource } from '../config/database';
import config from '../config';

/**
 * MiniCal Connector class that orchestrates communication between MiniCal PMS and the middleware
 */
export class MiniCalConnector {
  private miniCalService: MiniCalService;
  private miniCalMapper: MiniCalMapper;
  private yieldPlanetService: YieldPlanetService;
  private propertyRepository = AppDataSource.getRepository(Property);
  private reservationRepository = AppDataSource.getRepository(Reservation);
  private requestLogRepository = AppDataSource.getRepository(RequestLog);

  /**
   * Creates a new MiniCal connector instance
   * @param miniCalConfig Optional MiniCal configuration
   * @param yieldPlanetConfig Optional YieldPlanet configuration
   */
  constructor(miniCalConfig?: any, yieldPlanetConfig?: any) {
    this.miniCalService = new MiniCalService(miniCalConfig);
    this.miniCalMapper = new MiniCalMapper();
    this.yieldPlanetService = new YieldPlanetService(yieldPlanetConfig);
  }

  /**
   * Fetches room types from MiniCal and maps them to YieldPlanet format
   * @param propertyId Property ID
   * @returns Mapped room types
   */
  async fetchAndMapRoomTypes(propertyId: string): Promise<YieldPlanetRoom[]> {
    try {
      // Log the request
      const startTime = Date.now();
      
      // Fetch room types from MiniCal
      const roomTypes = await this.miniCalService.getRoomTypes(propertyId);
      
      // Map room types to YieldPlanet format
      const mappedRoomTypes = roomTypes.map((roomType: MiniCalRoomType) => 
        this.miniCalMapper.mapRoomTypeToYieldPlanetRoom(roomType)
      );
      
      // Log the response
      await this.logRequest(
        'GET',
        `/properties/${propertyId}/room_types`,
        null,
        mappedRoomTypes,
        200,
        Date.now() - startTime,
        propertyId
      );
      
      return mappedRoomTypes;
    } catch (error: any) {
      // Log the error
      await this.logRequest(
        'GET',
        `/properties/${propertyId}/room_types`,
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
   * Fetches rate plans from MiniCal and maps them to YieldPlanet format
   * @param propertyId Property ID
   * @returns Mapped rate plans
   */
  async fetchAndMapRatePlans(propertyId: string): Promise<YieldPlanetRatePlan[]> {
    try {
      // Log the request
      const startTime = Date.now();
      
      // Fetch rate plans from MiniCal
      const ratePlans = await this.miniCalService.getRatePlans(propertyId);
      
      // Map rate plans to YieldPlanet format
      const mappedRatePlans = ratePlans.map((ratePlan: MiniCalRatePlan) => 
        this.miniCalMapper.mapRatePlanToYieldPlanetRatePlan(ratePlan)
      );
      
      // Log the response
      await this.logRequest(
        'GET',
        `/properties/${propertyId}/rate_plans`,
        null,
        mappedRatePlans,
        200,
        Date.now() - startTime,
        propertyId
      );
      
      return mappedRatePlans;
    } catch (error: any) {
      // Log the error
      await this.logRequest(
        'GET',
        `/properties/${propertyId}/rate_plans`,
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
   * Creates a booking in MiniCal from a YieldPlanet reservation
   * @param yieldPlanetReservation YieldPlanet reservation
   * @returns Created booking
   */
  async createBookingFromYieldPlanet(yieldPlanetReservation: YieldPlanetReservation): Promise<MiniCalBooking> {
    try {
      // Log the request
      const startTime = Date.now();
      
      // Map YieldPlanet reservation to MiniCal booking
      const bookingData = this.miniCalMapper.mapYieldPlanetReservationToBooking(yieldPlanetReservation);
      
      // Create booking in MiniCal
      const createdBooking = await this.miniCalService.createBooking(
        yieldPlanetReservation.propertyId,
        bookingData
      );
      
      // Store the reservation in the database
      const reservation = new Reservation();
      reservation.propertyId = yieldPlanetReservation.propertyId;
      reservation.roomTypeId = yieldPlanetReservation.roomId;
      reservation.guestName = yieldPlanetReservation.guestName;
      reservation.guestEmail = yieldPlanetReservation.guestEmail;
      reservation.checkInDate = new Date(yieldPlanetReservation.checkIn);
      reservation.checkOutDate = new Date(yieldPlanetReservation.checkOut);
      reservation.adults = yieldPlanetReservation.adults;
      reservation.children = yieldPlanetReservation.children;
      reservation.totalPrice = yieldPlanetReservation.totalPrice;
      reservation.currency = yieldPlanetReservation.currency;
      reservation.status = 'confirmed';
      reservation.externalReservationId = createdBooking.id;
      reservation.yieldPlanetReservationId = yieldPlanetReservation.id;
      
      await this.reservationRepository.save(reservation);
      
      // Log the response
      await this.logRequest(
        'POST',
        `/properties/${yieldPlanetReservation.propertyId}/bookings`,
        bookingData,
        createdBooking,
        200,
        Date.now() - startTime,
        yieldPlanetReservation.propertyId
      );
      
      return createdBooking;
    } catch (error: any) {
      // Log the error
      await this.logRequest(
        'POST',
        `/properties/${yieldPlanetReservation.propertyId}/bookings`,
        yieldPlanetReservation,
        null,
        error.response?.status || 500,
        0,
        yieldPlanetReservation.propertyId,
        error.message
      );
      
      throw error;
    }
  }

  /**
   * Updates availability in YieldPlanet based on MiniCal data
   * @param propertyId Property ID
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   * @returns Update result
   */
  async syncAvailabilityToYieldPlanet(propertyId: string, startDate: string, endDate: string): Promise<any> {
    try {
      // Log the request
      const startTime = Date.now();
      
      // Fetch availability from MiniCal
      const availability = await this.miniCalService.getAvailability(propertyId, startDate, endDate);
      
      // Get property from database to access mappings
      const property = await this.propertyRepository.findOneBy({ yieldPlanetPropertyId: propertyId });
      
      if (!property) {
        throw new Error(`Property with ID ${propertyId} not found`);
      }
      
      // Process and send availability to YieldPlanet
      // This is a simplified implementation - in a real system, you would need to
      // map room types and handle the actual API calls to YieldPlanet
      
      // Log the response
      await this.logRequest(
        'GET',
        `/properties/${propertyId}/availability`,
        { startDate, endDate },
        availability,
        200,
        Date.now() - startTime,
        propertyId
      );
      
      return availability;
    } catch (error: any) {
      // Log the error
      await this.logRequest(
        'GET',
        `/properties/${propertyId}/availability`,
        { startDate, endDate },
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
   * Updates rates in YieldPlanet based on MiniCal data
   * @param propertyId Property ID
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   * @returns Update result
   */
  async syncRatesToYieldPlanet(propertyId: string, startDate: string, endDate: string): Promise<any> {
    try {
      // Log the request
      const startTime = Date.now();
      
      // Fetch rates from MiniCal
      const rates = await this.miniCalService.getRates(propertyId, startDate, endDate);
      
      // Get property from database to access mappings
      const property = await this.propertyRepository.findOneBy({ yieldPlanetPropertyId: propertyId });
      
      if (!property) {
        throw new Error(`Property with ID ${propertyId} not found`);
      }
      
      // Process and send rates to YieldPlanet
      // This is a simplified implementation - in a real system, you would need to
      // map rate plans and handle the actual API calls to YieldPlanet
      
      // Log the response
      await this.logRequest(
        'GET',
        `/properties/${propertyId}/rates`,
        { startDate, endDate },
        rates,
        200,
        Date.now() - startTime,
        propertyId
      );
      
      return rates;
    } catch (error: any) {
      // Log the error
      await this.logRequest(
        'GET',
        `/properties/${propertyId}/rates`,
        { startDate, endDate },
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
   * Logs an API request to the database
   * @param method HTTP method
   * @param endpoint API endpoint
   * @param requestBody Request body
   * @param responseBody Response body
   * @param statusCode HTTP status code
   * @param duration Request duration in milliseconds
   * @param propertyId Property ID
   * @param errorMessage Error message (if any)
   */
  private async logRequest(
    method: string,
    endpoint: string,
    requestBody: any,
    responseBody: any,
    statusCode: number,
    duration: number,
    propertyId?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const requestLog = new RequestLog();
      requestLog.method = method;
      requestLog.endpoint = endpoint;
      requestLog.requestBody = requestBody;
      requestLog.responseBody = responseBody;
      requestLog.statusCode = statusCode;
      requestLog.duration = duration;
      requestLog.propertyId = propertyId;
      requestLog.errorMessage = errorMessage;
      
      await this.requestLogRepository.save(requestLog);
    } catch (error) {
      console.error('Failed to log request:', error);
    }
  }
}
