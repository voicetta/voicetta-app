import { MiniCalConnector } from '../services/miniCal.connector';
import { YieldPlanetService } from '../services/yieldPlanet.service';
import { Property } from '../models/Property';
import { Reservation } from '../models/Reservation';
import { AppDataSource } from '../config/database';
import { Request, Response } from 'express';

/**
 * Controller for handling property-related operations
 */
export class PropertyController {
  private miniCalConnector: MiniCalConnector;
  private yieldPlanetService: YieldPlanetService;
  private propertyRepository = AppDataSource.getRepository(Property);

  constructor() {
    this.miniCalConnector = new MiniCalConnector();
    this.yieldPlanetService = new YieldPlanetService();
  }

  /**
   * Get all properties
   * @param req Express request
   * @param res Express response
   */
  getAllProperties = async (req: Request, res: Response): Promise<void> => {
    try {
      const properties = await this.propertyRepository.find();
      res.status(200).json(properties);
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Get property by ID
   * @param req Express request
   * @param res Express response
   */
  getPropertyById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const property = await this.propertyRepository.findOneBy({ id });

      if (!property) {
        res.status(404).json({
          status: 'error',
          message: `Property with ID ${id} not found`,
          code: 'PROPERTY_NOT_FOUND'
        });
        return;
      }

      res.status(200).json(property);
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Create a new property
   * @param req Express request
   * @param res Express response
   */
  createProperty = async (req: Request, res: Response): Promise<void> => {
    try {
      const propertyData = req.body;
      
      // Validate required fields
      if (!propertyData.name || !propertyData.yieldPlanetPropertyId || !propertyData.clientId) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required fields: name, yieldPlanetPropertyId, clientId',
          code: 'INVALID_REQUEST'
        });
        return;
      }

      // Create new property
      const property = this.propertyRepository.create(propertyData);
      const savedProperty = await this.propertyRepository.save(property);

      res.status(201).json(savedProperty);
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Update a property
   * @param req Express request
   * @param res Express response
   */
  updateProperty = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const propertyData = req.body;
      
      // Check if property exists
      const property = await this.propertyRepository.findOneBy({ id });
      
      if (!property) {
        res.status(404).json({
          status: 'error',
          message: `Property with ID ${id} not found`,
          code: 'PROPERTY_NOT_FOUND'
        });
        return;
      }

      // Update property
      await this.propertyRepository.update(id, propertyData);
      
      // Get updated property
      const updatedProperty = await this.propertyRepository.findOneBy({ id });
      
      res.status(200).json(updatedProperty);
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Delete a property
   * @param req Express request
   * @param res Express response
   */
  deleteProperty = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if property exists
      const property = await this.propertyRepository.findOneBy({ id });
      
      if (!property) {
        res.status(404).json({
          status: 'error',
          message: `Property with ID ${id} not found`,
          code: 'PROPERTY_NOT_FOUND'
        });
        return;
      }

      // Delete property
      await this.propertyRepository.delete(id);
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Fetch room types from MiniCal and map to YieldPlanet format
   * @param req Express request
   * @param res Express response
   */
  fetchRoomTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      const { propertyId } = req.params;
      
      // Check if property exists
      const property = await this.propertyRepository.findOneBy({ id: propertyId });
      
      if (!property) {
        res.status(404).json({
          status: 'error',
          message: `Property with ID ${propertyId} not found`,
          code: 'PROPERTY_NOT_FOUND'
        });
        return;
      }

      // Fetch and map room types
      const roomTypes = await this.miniCalConnector.fetchAndMapRoomTypes(property.yieldPlanetPropertyId);
      
      res.status(200).json(roomTypes);
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Fetch rate plans from MiniCal and map to YieldPlanet format
   * @param req Express request
   * @param res Express response
   */
  fetchRatePlans = async (req: Request, res: Response): Promise<void> => {
    try {
      const { propertyId } = req.params;
      
      // Check if property exists
      const property = await this.propertyRepository.findOneBy({ id: propertyId });
      
      if (!property) {
        res.status(404).json({
          status: 'error',
          message: `Property with ID ${propertyId} not found`,
          code: 'PROPERTY_NOT_FOUND'
        });
        return;
      }

      // Fetch and map rate plans
      const ratePlans = await this.miniCalConnector.fetchAndMapRatePlans(property.yieldPlanetPropertyId);
      
      res.status(200).json(ratePlans);
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message,
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * Sync availability from MiniCal to YieldPlanet
   * @param req Express request
   * @param res Express response
   */
  syncAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const { propertyId } = req.params;
      const { startDate, endDate } = req.body;
      
      // Validate required fields
      if (!startDate || !endDate) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required fields: startDate, endDate',
          code: 'INVALID_REQUEST'
        });
        return;
      }
      
      // Check if property exists
      const property = await this.propertyRepository.findOneBy({ id: propertyId });
      
      if (!property) {
        res.status(404).json({
          status: 'error',
          message: `Property with ID ${propertyId} not found`,
          code: 'PROPERTY_NOT_FOUND'
        });
        return;
      }

      // Sync availability
      const result = await this.miniCalConnector.syncAvailabilityToYieldPlanet(
        property.yieldPlanetPropertyId,
        startDate,
        endDate
      );
      
      res.status(200).json({
        status: 'success',
        message: 'Availability synchronized successfully',
        data: result
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
   * Sync rates from MiniCal to YieldPlanet
   * @param req Express request
   * @param res Express response
   */
  syncRates = async (req: Request, res: Response): Promise<void> => {
    try {
      const { propertyId } = req.params;
      const { startDate, endDate } = req.body;
      
      // Validate required fields
      if (!startDate || !endDate) {
        res.status(400).json({
          status: 'error',
          message: 'Missing required fields: startDate, endDate',
          code: 'INVALID_REQUEST'
        });
        return;
      }
      
      // Check if property exists
      const property = await this.propertyRepository.findOneBy({ id: propertyId });
      
      if (!property) {
        res.status(404).json({
          status: 'error',
          message: `Property with ID ${propertyId} not found`,
          code: 'PROPERTY_NOT_FOUND'
        });
        return;
      }

      // Sync rates
      const result = await this.miniCalConnector.syncRatesToYieldPlanet(
        property.yieldPlanetPropertyId,
        startDate,
        endDate
      );
      
      res.status(200).json({
        status: 'success',
        message: 'Rates synchronized successfully',
        data: result
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
