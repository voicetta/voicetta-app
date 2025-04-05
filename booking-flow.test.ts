import { MiniCalConnector } from '../services/miniCal.connector';
import { YieldPlanetConnector } from '../services/yieldPlanet.connector';
import { Property } from '../models/Property';
import { Reservation } from '../models/Reservation';
import { AppDataSource } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Test script for end-to-end booking flow between MiniCal and YieldPlanet
 */
async function testBookingFlow() {
  try {
    logger.info('Starting end-to-end booking flow test');
    
    // Initialize repositories
    const propertyRepository = AppDataSource.getRepository(Property);
    const reservationRepository = AppDataSource.getRepository(Reservation);
    
    // Initialize connectors
    const miniCalConnector = new MiniCalConnector();
    const yieldPlanetConnector = new YieldPlanetConnector();
    
    // 1. Get a test property
    logger.info('Fetching test property');
    const property = await propertyRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' }
    });
    
    if (!property) {
      throw new Error('No active property found for testing');
    }
    
    logger.info(`Using property: ${property.name} (ID: ${property.id})`);
    
    // 2. Test inventory synchronization
    logger.info('Testing inventory synchronization from MiniCal to YieldPlanet');
    
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30); // 30 days from now
    const endDateStr = endDate.toISOString().split('T')[0];
    
    logger.info(`Synchronizing inventory for date range: ${startDate} to ${endDateStr}`);
    
    const inventoryResult = await yieldPlanetConnector.syncInventoryFromMiniCal(
      property.id,
      startDate,
      endDateStr
    );
    
    logger.info('Inventory synchronization completed', { result: inventoryResult });
    
    // 3. Test rate synchronization
    logger.info('Testing rate synchronization from MiniCal to YieldPlanet');
    
    const ratesResult = await yieldPlanetConnector.syncRatesFromMiniCal(
      property.id,
      startDate,
      endDateStr
    );
    
    logger.info('Rate synchronization completed', { result: ratesResult });
    
    // 4. Test reservation creation from YieldPlanet to MiniCal
    logger.info('Testing reservation creation from YieldPlanet to MiniCal');
    
    // Create a test reservation in YieldPlanet format
    const checkInDate = new Date();
    checkInDate.setDate(today.getDate() + 7); // 7 days from now
    
    const checkOutDate = new Date();
    checkOutDate.setDate(today.getDate() + 9); // 9 days from now (2-night stay)
    
    const roomType = property.roomTypes[0];
    
    const testReservation = {
      propertyId: property.yieldPlanetPropertyId,
      roomId: roomType.id,
      checkIn: checkInDate.toISOString().split('T')[0],
      checkOut: checkOutDate.toISOString().split('T')[0],
      guestName: 'Test Guest',
      guestEmail: 'test@example.com',
      adults: 2,
      children: 0,
      totalPrice: roomType.basePrice * 2, // 2 nights
      currency: 'USD'
    };
    
    logger.info('Creating test reservation', { reservation: testReservation });
    
    const createdReservation = await miniCalConnector.createBookingFromYieldPlanet(testReservation);
    
    logger.info('Test reservation created successfully', { 
      reservationId: createdReservation.id,
      bookingNumber: createdReservation.booking_number
    });
    
    // 5. Verify reservation was stored in our database
    const dbReservation = await reservationRepository.findOne({
      where: { externalReservationId: createdReservation.id }
    });
    
    if (!dbReservation) {
      throw new Error('Reservation was not stored in the database');
    }
    
    logger.info('Verified reservation was stored in database', { 
      dbReservationId: dbReservation.id,
      status: dbReservation.status
    });
    
    // 6. Test complete
    logger.info('End-to-end booking flow test completed successfully');
    
    return {
      success: true,
      property: {
        id: property.id,
        name: property.name
      },
      inventorySyncResult: inventoryResult,
      rateSyncResult: ratesResult,
      reservation: {
        id: createdReservation.id,
        bookingNumber: createdReservation.booking_number,
        checkIn: testReservation.checkIn,
        checkOut: testReservation.checkOut,
        guestName: testReservation.guestName,
        totalPrice: testReservation.totalPrice,
        currency: testReservation.currency
      }
    };
  } catch (error) {
    logger.error('Error in end-to-end booking flow test:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  // Initialize database connection
  AppDataSource.initialize()
    .then(async () => {
      try {
        const result = await testBookingFlow();
        console.log('Test completed successfully:', JSON.stringify(result, null, 2));
        process.exit(0);
      } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

export { testBookingFlow };
