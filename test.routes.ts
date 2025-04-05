import { Request, Response } from 'express';
import { testBookingFlow } from '../tests/booking-flow.test';
import { logger } from '../utils/logger';
import { Router } from 'express';

const router = Router();

/**
 * POST /api/test/booking-flow - Run the end-to-end booking flow test
 */
router.post('/booking-flow', async (req: Request, res: Response) => {
  try {
    logger.info('Starting end-to-end booking flow test via API');
    
    // Run the booking flow test
    const result = await testBookingFlow();
    
    res.status(200).json({
      status: 'success',
      message: 'End-to-end booking flow test completed successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Error running end-to-end booking flow test:', error);
    
    res.status(500).json({
      status: 'error',
      message: error.message,
      code: 'TEST_FAILED'
    });
  }
});

export default router;
