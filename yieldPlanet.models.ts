/**
 * YieldPlanet data model interfaces
 */

export interface YieldPlanetRoom {
  id: string;
  name: string;
  description?: string;
  baseOccupancy: number;
  maxOccupancy: number;
  minNumAdults: number;
  maxNumAdults: number;
  defaultAllotment: number;
  defaultPrices: {
    occupancy: number;
    price: number;
  }[];
  active: boolean;
}

export interface YieldPlanetRatePlan {
  id: string;
  name: string;
  description?: string;
  roomId: string;
  active: boolean;
  isPackage: boolean;
  isNonRefundable: boolean;
  priceModel: 'per_room' | 'per_person';
  restrictions?: {
    minStay?: number;
    maxStay?: number;
    closedToArrival?: boolean;
    closedToDeparture?: boolean;
  };
}

export interface YieldPlanetAvailability {
  date: string;
  roomId: string;
  allotment: number;
  status: 'available' | 'unavailable';
}

export interface YieldPlanetRate {
  date: string;
  roomId: string;
  ratePlanId: string;
  price: number;
  currency: string;
  occupancy?: number;
  restrictions?: {
    minStay?: number;
    maxStay?: number;
    closedToArrival?: boolean;
    closedToDeparture?: boolean;
  };
}

export interface YieldPlanetReservation {
  id?: string;
  propertyId: string;
  roomId: string;
  ratePlanId?: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  adults: number;
  children?: number;
  totalPrice: number;
  currency: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  externalReservationId?: string;
  specialRequests?: string;
  guestDetails?: {
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
  paymentDetails?: {
    method?: string;
    cardType?: string;
    cardNumber?: string;
    expiryDate?: string;
  };
}

export interface YieldPlanetProperty {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  amenities?: string[];
  policies?: {
    checkInTime?: string;
    checkOutTime?: string;
    cancellationPolicy?: string;
    otherPolicies?: Record<string, string>;
  };
}
