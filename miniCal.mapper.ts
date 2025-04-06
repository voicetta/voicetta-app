import { MiniCalRoomType, MiniCalRatePlan, MiniCalBooking, MiniCalProperty } from '../models/miniCal.models';
import { YieldPlanetRoom, YieldPlanetRatePlan, YieldPlanetReservation, YieldPlanetProperty } from '../models/yieldPlanet.models';

/**
 * Service for mapping data between MiniCal and YieldPlanet formats
 */
export class MiniCalMapper {
  /**
   * Maps a MiniCal room type to a YieldPlanet room
   * @param miniCalRoom MiniCal room type
   * @returns YieldPlanet room
   */
  mapRoomTypeToYieldPlanetRoom(miniCalRoom: MiniCalRoomType): YieldPlanetRoom {
    return {
      id: miniCalRoom.id,
      name: miniCalRoom.name,
      description: miniCalRoom.description,
      baseOccupancy: 2, // Default base occupancy
      maxOccupancy: miniCalRoom.max_occupancy,
      minNumAdults: 1,
      maxNumAdults: miniCalRoom.max_adults,
      defaultAllotment: 1, // Default allotment
      defaultPrices: [
        {
          occupancy: 1,
          price: miniCalRoom.default_rate
        },
        {
          occupancy: 2,
          price: miniCalRoom.default_rate
        }
      ],
      active: miniCalRoom.status === 'active'
    };
  }

  /**
   * Maps a MiniCal rate plan to a YieldPlanet rate plan
   * @param miniCalRatePlan MiniCal rate plan
   * @returns YieldPlanet rate plan
   */
  mapRatePlanToYieldPlanetRatePlan(miniCalRatePlan: MiniCalRatePlan): YieldPlanetRatePlan {
    return {
      id: miniCalRatePlan.id,
      name: miniCalRatePlan.name,
      description: miniCalRatePlan.description,
      roomId: miniCalRatePlan.room_type_id,
      active: miniCalRatePlan.is_shown_in_online_booking,
      isPackage: miniCalRatePlan.rate_type === 'package',
      isNonRefundable: miniCalRatePlan.rate_type === 'non_refundable',
      priceModel: miniCalRatePlan.charge_type === 'per_room' ? 'per_room' : 'per_person'
    };
  }

  /**
   * Maps a MiniCal booking to a YieldPlanet reservation
   * @param booking MiniCal booking
   * @param yieldPlanetPropertyId YieldPlanet property ID
   * @returns YieldPlanet reservation
   */
  mapBookingToYieldPlanetReservation(booking: MiniCalBooking, yieldPlanetPropertyId: string): YieldPlanetReservation {
    return {
      id: '', // Will be assigned by YieldPlanet
      propertyId: yieldPlanetPropertyId,
      roomId: booking.roomTypeId, // Assuming IDs are mapped correctly
      ratePlanId: booking.ratePlanId, // Assuming IDs are mapped correctly
      status: 'new',
      checkIn: booking.checkInDate,
      checkOut: booking.checkOutDate,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      adults: booking.adults,
      children: booking.children || 0,
      totalPrice: booking.totalPrice,
      currency: booking.currency,
      source: 'Voicetta AI Agent',
      notes: `Booking created by Voicetta AI Agent. Original MiniCal Booking ID: ${booking.id}`,
      externalId: booking.id
    };
  }

  /**
   * Maps a YieldPlanet reservation to a MiniCal booking
   * @param yieldPlanetReservation YieldPlanet reservation
   * @returns MiniCal booking
   */
  mapYieldPlanetReservationToBooking(yieldPlanetReservation: YieldPlanetReservation): Partial<MiniCalBooking> {
    // Split guest name into first and last name
    const nameParts = yieldPlanetReservation.guestName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      property_id: yieldPlanetReservation.propertyId,
      room_type_id: yieldPlanetReservation.roomId,
      rate_plan_id: yieldPlanetReservation.ratePlanId,
      check_in_date: yieldPlanetReservation.checkIn,
      check_out_date: yieldPlanetReservation.checkOut,
      guest: {
        first_name: firstName,
        last_name: lastName,
        email: yieldPlanetReservation.guestEmail,
        phone: yieldPlanetReservation.guestPhone,
        address: yieldPlanetReservation.guestDetails?.address,
        city: yieldPlanetReservation.guestDetails?.city,
        country: yieldPlanetReservation.guestDetails?.country,
        postal_code: yieldPlanetReservation.guestDetails?.postalCode
      },
      adults: yieldPlanetReservation.adults,
      children: yieldPlanetReservation.children || 0,
      status: yieldPlanetReservation.status === 'confirmed' ? 'confirmed' : 
              yieldPlanetReservation.status === 'cancelled' ? 'canceled' : 'confirmed',
      payment: {
        total_amount: yieldPlanetReservation.totalPrice,
        currency: yieldPlanetReservation.currency,
        payment_method: yieldPlanetReservation.paymentDetails?.method,
        card_type: yieldPlanetReservation.paymentDetails?.cardType,
        card_number: yieldPlanetReservation.paymentDetails?.cardNumber,
        expiry_date: yieldPlanetReservation.paymentDetails?.expiryDate
      },
      special_requests: yieldPlanetReservation.specialRequests
    };
  }

  /**
   * Maps a MiniCal property to a YieldPlanet property
   * @param miniCalProperty MiniCal property
   * @returns YieldPlanet property
   */
  mapPropertyToYieldPlanetProperty(miniCalProperty: MiniCalProperty): YieldPlanetProperty {
    return {
      id: miniCalProperty.id,
      name: miniCalProperty.name,
      description: miniCalProperty.description,
      address: miniCalProperty.address,
      city: miniCalProperty.city,
      country: miniCalProperty.country,
      postalCode: miniCalProperty.postal_code,
      amenities: miniCalProperty.amenities,
      policies: {
        checkInTime: miniCalProperty.check_in_time,
        checkOutTime: miniCalProperty.check_out_time,
        cancellationPolicy: miniCalProperty.policies?.cancellation_policy,
        otherPolicies: miniCalProperty.policies?.other_policies
      }
    };
  }
}
