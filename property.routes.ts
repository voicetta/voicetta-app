import { Router } from 'express';
import { PropertyController } from '../controllers/property.controller';

const router = Router();
const propertyController = new PropertyController();

// GET /api/properties - Get all properties
router.get('/', propertyController.getAllProperties);

// GET /api/properties/:id - Get property by ID
router.get('/:id', propertyController.getPropertyById);

// POST /api/properties - Create new property
router.post('/', propertyController.createProperty);

// PUT /api/properties/:id - Update property
router.put('/:id', propertyController.updateProperty);

// DELETE /api/properties/:id - Delete property
router.delete('/:id', propertyController.deleteProperty);

// GET /api/properties/:propertyId/room-types - Fetch room types from MiniCal
router.get('/:propertyId/room-types', propertyController.fetchRoomTypes);

// GET /api/properties/:propertyId/rate-plans - Fetch rate plans from MiniCal
router.get('/:propertyId/rate-plans', propertyController.fetchRatePlans);

// POST /api/properties/:propertyId/sync-availability - Sync availability to YieldPlanet
router.post('/:propertyId/sync-availability', propertyController.syncAvailability);

// POST /api/properties/:propertyId/sync-rates - Sync rates to YieldPlanet
router.post('/:propertyId/sync-rates', propertyController.syncRates);

export default router;
