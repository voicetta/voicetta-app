import { MiniCalConnector } from '../services/miniCal.connector';
import { YieldPlanetService } from '../services/yieldPlanet.service';
import { Reservation } from '../models/Reservation';
import { Property } from '../models/Property';
import { AppDataSource } from '../config/database';
import { Request, Response } from 'express';
import { YieldPlanetReservation } from '../models/yieldPlanet.models';

/**
 * Controller for handling reservation-related operations
 */
export class ReservationController {
  private miniCalConnector: MiniCalConnector;
  private yieldPlanetService: YieldPlanetService;
  private reservationRepository = AppDataSource.getRepository(Reservation);
  private propertyRepository = AppDataSource.getRepository(Property);

  constructor() {
    this.miniCalConnector = new MiniCalConnector();
    this.yieldPlanetService = new YieldPlanetService();
  }

  /**
   * Get all reservations
   * @param req Express request
   * @param res Express response
   */
  getAllReservations = async (req: Request, res: Response): Promise<void> => {
    try {
      const reservations = await this.reservationRepository.find();
      res.status(200).json(reservations);
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Get reservation by ID
   * @param req Express request
   * @param res Express response
   */
  getReservationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const reservation = await this.reservationRepository.findOneBy({ id });

      if (!reservation) {
        res.status(404).json({
          status: 'error',
          message: `Reservation with ID ${id} not found`,
          code: 'RESERVATION_NOT_FOUND'
        });
        return;
      }

      res.status(200).json(reservation);
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Create a new reservation
   * @param req Express request
   * @param res Express response
   */
  createReservation = async (req: Request, res: Response): Promise<void> => {
    try {
      const reservationData = req.body;
      
      // Validate required fields
      if (!this.validateReservationData(reservationData)) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required reservation fields',
          code: 'INVALID_REQUEST'
        });
        return;
      }

      // Check if property exists
      const property = await this.propertyRepository.findOneBy({ id: reservationData.propertyId });
      
      if (!property) {
        res.status(404).json({
          status: 'error',
          message: `Property with ID ${reservationData.propertyId} not found`,
          code: 'PROPERTY_NOT_FOUND'
        });
        return;
      }

      // Create YieldPlanet reservation object
      const yieldPlanetReservation: YieldPlanetReservation = {
        propertyId: property.yieldPlanetPropertyId,
        roomId: reservationData.roomTypeId,
        checkIn: this.formatDate(reservationData.checkInDate),
        checkOut: this.formatDate(reservationData.checkOutDate),
        guestName: reservationData.guestName,
        guestEmail: reservationData.guestEmail,
        adults: reservationData.adults,
        children: reservationData.children,
        totalPrice: reservationData.totalPrice,
        currency: reservationData.currency
      };

      // Create booking in MiniCal through connector
      const createdBooking = await this.miniCalConnector.createBookingFromYieldPlanet(yieldPlanetReservation);

      // Create reservation in database
      const reservation = this.reservationRepository.create({
        ...reservationData,
        externalReservationId: createdBooking.id,
        status: 'confirmed'
      });
      
      const savedReservation = await this.reservationRepository.save(reservation);

      res.status(201).json(savedReservation);
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Update a reservation
   * @param req Express request
   * @param res Express response
   */
  updateReservation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const reservationData = req.body;
      
      // Check if reservation exists
      const reservation = await this.reservationRepository.findOneBy({ id });
      
      if (!reservation) {
        res.status(404).json({
          status: 'error',
          message: `Reservation with ID ${id} not found`,
          code: 'RESERVATION_NOT_FOUND'
        });
        return;
      }

      // Update reservation in database
      await this.reservationRepository.update(id, reservationData);
      
      // Get updated reservation
      const updatedReservation = await this.reservationRepository.findOneBy({ id });
      
      // TODO: Implement update in MiniCal through connector
      // This would require additional implementation in the MiniCalConnector

      res.status(200).json(updatedReservation);
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Cancel a reservation
   * @param req Express request
   * @param res Express response
   */
  cancelReservation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if reservation exists
      const reservation = await this.reservationRepository.findOneBy({ id });
      
      if (!reservation) {
        res.status(404).json({
          status: 'error',
          message: `Reservation with ID ${id} not found`,
          code: 'RESERVATION_NOT_FOUND'
        });
        return;
      }

      // Update reservation status in database
      await this.reservationRepository.update(id, { status: 'cancelled' });
      
      // TODO: Implement cancellation in MiniCal through connector
      // This would require additional implementation in the MiniCalConnector

      res.status(200).json({
        status: 'success',
        message: 'Reservation cancelled successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Validate reservation data
   * @param data Reservation data
   * @returns Whether the data is valid
   */
  private validateReservationData(data: any): boolean {
    return !!(
      data.propertyId &&
      data.roomTypeId &&
      data.guestName &&
      data.guestEmail &&
      data.checkInDate &&
      data.checkOutDate &&
      data.adults &&
      data.totalPrice &&
      data.currency
    );
  }

  /**
   * Format date to YYYY-MM-DD
   * @param date Date to format
   * @returns Formatted date
   */
  private formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  /**
   * Create a reservation from AI agent and push to YieldPlanet
   * @param req Express request
   * @param res Express response
   */
  createAIAgentReservation = async (req: Request, res: Response): Promise<void> => {
    try {
      const reservationData = req.body;
      
      // Validate required fields
      if (!this.validateReservationData(reservationData)) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required reservation fields',
          code: 'INVALID_REQUEST'
        });
        return;
      }

      // Check if property exists
      const property = await this.propertyRepository.findOneBy({ id: reservationData.propertyId });
      
      if (!property) {
        res.status(404).json({
          status: 'error',
          message: `Property with ID ${reservationData.propertyId} not found`,
          code: 'PROPERTY_NOT_FOUND'
        });
        return;
      }

      // Add source information to identify AI agent bookings
      reservationData.source = reservationData.source || 'ai_agent';

      // Create reservation in database first to track the process
      const reservation = this.reservationRepository.create({
        ...reservationData,
        status: 'pending'
      });
      
      const savedReservation = await this.reservationRepository.save(reservation);

      // Create booking in MiniCal
      const miniCalBooking = {
        id: savedReservation.id, // Use our reservation ID as reference
        roomTypeId: reservationData.roomTypeId,
        ratePlanId: reservationData.ratePlanId || 'DEFAULT', // Use default rate plan if not specified
        checkInDate: this.formatDate(reservationData.checkInDate),
        checkOutDate: this.formatDate(reservationData.checkOutDate),
        guestName: reservationData.guestName,
        guestEmail: reservationData.guestEmail,
        guestPhone: reservationData.guestPhone,
        adults: reservationData.adults,
        children: reservationData.children || 0,
        totalPrice: reservationData.totalPrice,
        currency: reservationData.currency
      };

      // Push the booking to YieldPlanet
      const yieldPlanetReservation = await this.miniCalConnector.pushBookingToYieldPlanet(
        miniCalBooking, 
        reservationData.propertyId
      );

      // Update the reservation with external IDs
      await this.reservationRepository.update(savedReservation.id, {
        status: 'confirmed',
        yieldPlanetReservationId: yieldPlanetReservation.id
      });

      // Get the updated reservation
      const updatedReservation = await this.reservationRepository.findOneBy({ id: savedReservation.id });

      res.status(201).json({
        status: 'success',
        message: 'Reservation created successfully and pushed to YieldPlanet',
        data: updatedReservation
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  };
}
