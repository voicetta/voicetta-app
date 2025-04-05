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
   * @param miniCalBooking MiniCal booking
   * @returns YieldPlanet reservation
   */
  mapBookingToYieldPlanetReservation(miniCalBooking: MiniCalBooking): YieldPlanetReservation {
    return {
      id: miniCalBooking.id,
      propertyId: miniCalBooking.property_id,
      roomId: miniCalBooking.room_type_id,
      ratePlanId: miniCalBooking.rate_plan_id,
      checkIn: miniCalBooking.check_in_date,
      checkOut: miniCalBooking.check_out_date,
      guestName: `${miniCalBooking.guest.first_name} ${miniCalBooking.guest.last_name}`,
      guestEmail: miniCalBooking.guest.email,
      adults: miniCalBooking.adults,
      children: miniCalBooking.children,
      totalPrice: miniCalBooking.payment.total_amount,
      currency: miniCalBooking.payment.currency,
      status: miniCalBooking.status === 'confirmed' ? 'confirmed' : 
              miniCalBooking.status === 'canceled' ? 'cancelled' : 'pending',
      specialRequests: miniCalBooking.special_requests,
      guestDetails: {
        phone: miniCalBooking.guest.phone,
        address: miniCalBooking.guest.address,
        city: miniCalBooking.guest.city,
        country: miniCalBooking.guest.country,
        postalCode: miniCalBooking.guest.postal_code
      },
      paymentDetails: {
        method: miniCalBooking.payment.payment_method,
        cardType: miniCalBooking.payment.card_type,
        cardNumber: miniCalBooking.payment.card_number,
        expiryDate: miniCalBooking.payment.expiry_date
      }
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
        phone: yieldPlanetReservation.guestDetails?.phone,
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
