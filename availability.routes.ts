import { Router } from 'express';
import { MiniCalConnector } from '../services/miniCal.connector';
import { YieldPlanetService } from '../services/yieldPlanet.service';
import { Property } from '../models/Property';
import { AppDataSource } from '../config/database';
import { Request, Response } from 'express';

const router = Router();
const propertyRepository = AppDataSource.getRepository(Property);
const miniCalConnector = new MiniCalConnector();
const yieldPlanetService = new YieldPlanetService();

/**
 * GET /api/availability - Check room availability
 * 
 * Query parameters:
 * - propertyId: string
 * - checkIn: string (YYYY-MM-DD)
 * - checkOut: string (YYYY-MM-DD)
 * - adults: number
 * - children?: number
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { propertyId, checkIn, checkOut, adults, children } = req.query;
    
    // Validate required parameters
    if (!propertyId || !checkIn || !checkOut || !adults) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required parameters: propertyId, checkIn, checkOut, adults',
        code: 'INVALID_REQUEST'
      });
    }

    // Check if property exists
    const property = await propertyRepository.findOneBy({ id: propertyId as string });
    
    if (!property) {
      return res.status(404).json({
        status: 'error',
        message: `Property with ID ${propertyId} not found`,
        code: 'PROPERTY_NOT_FOUND'
      });
    }

    // Get availability from MiniCal
    const availability = await miniCalConnector.syncAvailabilityToYieldPlanet(
      property.yieldPlanetPropertyId,
      checkIn as string,
      checkOut as string
    );

    // Get rates from MiniCal
    const rates = await miniCalConnector.syncRatesToYieldPlanet(
      property.yieldPlanetPropertyId,
      checkIn as string,
      checkOut as string
    );

    // Combine availability and rates data
    // This is a simplified implementation - in a real system, you would need to
    // process the data to create a comprehensive availability response
    const availabilityData = {
      propertyId: propertyId,
      checkIn: checkIn,
      checkOut: checkOut,
      adults: adults,
      children: children || 0,
      rooms: availability.map((room: any) => ({
        ...room,
        rates: rates.filter((rate: any) => rate.room_type_id === room.room_type_id)
      }))
    };

    res.status(200).json(availabilityData);
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
