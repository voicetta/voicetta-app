import { Router } from 'express';
import { Request, Response } from 'express';
import { MiniCalConnector } from '../services/miniCal.connector';
import { YieldPlanetConnector } from '../services/yieldPlanet.connector';
import { Property } from '../models/Property';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();
const propertyRepository = AppDataSource.getRepository(Property);
const miniCalConnector = new MiniCalConnector();
const yieldPlanetConnector = new YieldPlanetConnector();

/**
 * GET /api/setup/status - Check setup status
 */
router.get('/status/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    
    // Check if property exists
    const property = await propertyRepository.findOneBy({ id: propertyId });
    
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: `Property with ID ${propertyId} not found`,
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    // Check if property has YieldPlanet configuration
    const hasYieldPlanetConfig = !!property.yieldPlanetConfig?.credentials?.username;
    
    // Check if property has room type mappings
    const hasRoomTypeMappings = !!property.yieldPlanetConfig?.mappings?.roomTypes &&
      Object.keys(property.yieldPlanetConfig.mappings.roomTypes).length > 0;
    
    // Check if property has rate type mappings
    const hasRateTypeMappings = !!property.yieldPlanetConfig?.mappings?.rateTypes &&
      Object.keys(property.yieldPlanetConfig.mappings.rateTypes).length > 0;
    
    // Determine setup status
    const setupStatus = {
      propertyId: property.id,
      propertyName: property.name,
      isConfigured: hasYieldPlanetConfig,
      hasRoomTypeMappings,
      hasRateTypeMappings,
      isFullyConfigured: hasYieldPlanetConfig && hasRoomTypeMappings && hasRateTypeMappings,
      setupSteps: [
        {
          id: 'credentials',
          name: 'YieldPlanet Credentials',
          completed: hasYieldPlanetConfig
        },
        {
          id: 'room_types',
          name: 'Room Type Mappings',
          completed: hasRoomTypeMappings
        },
        {
          id: 'rate_types',
          name: 'Rate Type Mappings',
          completed: hasRateTypeMappings
        },
        {
          id: 'initial_sync',
          name: 'Initial Synchronization',
          completed: property.yieldPlanetConfig?.initialSyncCompleted || false
        }
      ]
    };
    
    res.status(200).json(setupStatus);
  } catch (error: any) {
    logger.error('Error checking setup status:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/setup/credentials - Set YieldPlanet credentials
 */
router.post('/credentials/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { username, apiKey } = req.body;
    
    // Validate required fields
    if (!username || !apiKey) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: username, apiKey',
        code: 'INVALID_REQUEST'
      });
    }
    
    // Check if property exists
    const property = await propertyRepository.findOneBy({ id: propertyId });
    
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: `Property with ID ${propertyId} not found`,
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    // Update property with YieldPlanet credentials
    if (!property.yieldPlanetConfig) {
      property.yieldPlanetConfig = {};
    }
    
    if (!property.yieldPlanetConfig.credentials) {
      property.yieldPlanetConfig.credentials = {};
    }
    
    property.yieldPlanetConfig.credentials.username = username;
    property.yieldPlanetConfig.credentials.apiKey = apiKey;
    
    await propertyRepository.save(property);
    
    res.status(200).json({
      status: 'success',
      message: 'YieldPlanet credentials saved successfully'
    });
  } catch (error: any) {
    logger.error('Error setting YieldPlanet credentials:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/setup/room-types/:propertyId - Get room types from MiniCal and YieldPlanet
 */
router.get('/room-types/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    
    // Check if property exists
    const property = await propertyRepository.findOneBy({ id: propertyId });
    
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: `Property with ID ${propertyId} not found`,
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    // Get room types from MiniCal
    const miniCalRoomTypes = await miniCalConnector.fetchAndMapRoomTypes(property.yieldPlanetPropertyId);
    
    // Get room types from YieldPlanet
    const yieldPlanetRoomTypes = await yieldPlanetConnector.fetchRooms(property.yieldPlanetPropertyId);
    
    // Get existing mappings
    const existingMappings = property.yieldPlanetConfig?.mappings?.roomTypes || {};
    
    // Combine data for response
    const roomTypeData = {
      miniCalRoomTypes,
      yieldPlanetRoomTypes,
      mappings: existingMappings
    };
    
    res.status(200).json(roomTypeData);
  } catch (error: any) {
    logger.error('Error fetching room types:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/setup/room-type-mappings/:propertyId - Save room type mappings
 */
router.post('/room-type-mappings/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { mappings } = req.body;
    
    // Validate required fields
    if (!mappings || typeof mappings !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Missing or invalid mappings object',
        code: 'INVALID_REQUEST'
      });
    }
    
    // Check if property exists
    const property = await propertyRepository.findOneBy({ id: propertyId });
    
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: `Property with ID ${propertyId} not found`,
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    // Update property with room type mappings
    if (!property.yieldPlanetConfig) {
      property.yieldPlanetConfig = {};
    }
    
    if (!property.yieldPlanetConfig.mappings) {
      property.yieldPlanetConfig.mappings = {};
    }
    
    property.yieldPlanetConfig.mappings.roomTypes = mappings;
    
    await propertyRepository.save(property);
    
    res.status(200).json({
      status: 'success',
      message: 'Room type mappings saved successfully'
    });
  } catch (error: any) {
    logger.error('Error saving room type mappings:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/setup/rate-plans/:propertyId - Get rate plans from MiniCal and YieldPlanet
 */
router.get('/rate-plans/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    
    // Check if property exists
    const property = await propertyRepository.findOneBy({ id: propertyId });
    
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: `Property with ID ${propertyId} not found`,
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    // Get rate plans from MiniCal
    const miniCalRatePlans = await miniCalConnector.fetchAndMapRatePlans(property.yieldPlanetPropertyId);
    
    // Get rate plans from YieldPlanet
    const yieldPlanetRatePlans = await yieldPlanetConnector.fetchRatePlans(property.yieldPlanetPropertyId);
    
    // Get existing mappings
    const existingMappings = property.yieldPlanetConfig?.mappings?.rateTypes || {};
    
    // Combine data for response
    const ratePlanData = {
      miniCalRatePlans,
      yieldPlanetRatePlans,
      mappings: existingMappings
    };
    
    res.status(200).json(ratePlanData);
  } catch (error: any) {
    logger.error('Error fetching rate plans:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/setup/rate-plan-mappings/:propertyId - Save rate plan mappings
 */
router.post('/rate-plan-mappings/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { mappings } = req.body;
    
    // Validate required fields
    if (!mappings || typeof mappings !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Missing or invalid mappings object',
        code: 'INVALID_REQUEST'
      });
    }
    
    // Check if property exists
    const property = await propertyRepository.findOneBy({ id: propertyId });
    
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: `Property with ID ${propertyId} not found`,
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    // Update property with rate plan mappings
    if (!property.yieldPlanetConfig) {
      property.yieldPlanetConfig = {};
    }
    
    if (!property.yieldPlanetConfig.mappings) {
      property.yieldPlanetConfig.mappings = {};
    }
    
    property.yieldPlanetConfig.mappings.rateTypes = mappings;
    
    await propertyRepository.save(property);
    
    res.status(200).json({
      status: 'success',
      message: 'Rate plan mappings saved successfully'
    });
  } catch (error: any) {
    logger.error('Error saving rate plan mappings:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/setup/initial-sync/:propertyId - Perform initial synchronization
 */
router.post('/initial-sync/:propertyId', async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { startDate, endDate } = req.body;
    
    // Validate required fields
    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: startDate, endDate',
        code: 'INVALID_REQUEST'
      });
    }
    
    // Check if property exists
    const property = await propertyRepository.findOneBy({ id: propertyId });
    
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: `Property with ID ${propertyId} not found`,
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    // Check if property is fully configured
    if (!property.yieldPlanetConfig?.credentials?.username ||
        !property.yieldPlanetConfig?.mappings?.roomTypes ||
        !property.yieldPlanetConfig?.mappings?.rateTypes) {
      return res.status(400).json({
        status: 'error',
        message: 'Property is not fully configured for synchronization',
        code: 'INCOMPLETE_SETUP'
      });
    }

    // Perform initial synchronization
    // 1. Sync inventory
    const inventoryResult = await yieldPlanetConnector.syncInventoryFromMiniCal(
      propertyId,
      startDate,
      endDate
    );
    
    // 2. Sync rates
    const ratesResult = await yieldPlanetConnector.syncRatesFromMiniCal(
      propertyId,
      startDate,
      endDate
    );
    
    // Mark initial sync as completed
    if (!property.yieldPlanetConfig) {
      property.yieldPlanetConfig = {};
    }
    
    property.yieldPlanetConfig.initialSyncCompleted = true;
    
    await propertyRepository.save(property);
    
    res.status(200).json({
      status: 'success',
      message: 'Initial synchronization completed successfully',
      data: {
        inventory: inventoryResult,
        rates: ratesResult
      }
    });
  } catch (error: any) {
    logger.error('Error performing initial synchronization:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
