/**
 * Interfaces for MiniCal data structures
 */

export interface MiniCalRoomType {
  id: string;
  name: string;
  description?: string;
  max_occupancy: number;
  max_adults: number;
  max_children: number;
  default_rate: number;
  image_url?: string;
  amenities?: string[];
  status: 'active' | 'inactive';
}

export interface MiniCalRatePlan {
  id: string;
  name: string;
  description?: string;
  room_type_id: string;
  is_shown_in_online_booking: boolean;
  charge_type: 'per_room' | 'per_person';
  rate_type: 'standard' | 'non_refundable' | 'package';
  base_rate: number;
  currency: string;
  taxes_and_fees?: {
    id: string;
    name: string;
    percentage: number;
    is_tax: boolean;
  }[];
}

export interface MiniCalAvailability {
  date: string;
  room_type_id: string;
  availability: number;
  status: 'available' | 'unavailable';
}

export interface MiniCalRate {
  date: string;
  rate_plan_id: string;
  rate: number;
  currency: string;
  min_length_of_stay?: number;
  max_length_of_stay?: number;
  closed_to_arrival?: boolean;
  closed_to_departure?: boolean;
}

export interface MiniCalBooking {
  id: string;
  booking_number: string;
  property_id: string;
  room_type_id: string;
  rate_plan_id: string;
  check_in_date: string;
  check_out_date: string;
  guest: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    postal_code?: string;
  };
  adults: number;
  children: number;
  status: 'confirmed' | 'canceled' | 'no_show';
  payment: {
    total_amount: number;
    currency: string;
    payment_method?: string;
    card_type?: string;
    card_number?: string;
    expiry_date?: string;
  };
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

export interface MiniCalProperty {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone: string;
  currency: string;
  check_in_time: string;
  check_out_time: string;
  policies?: {
    cancellation_policy?: string;
    deposit_policy?: string;
    pet_policy?: string;
    other_policies?: Record<string, string>;
  };
  amenities?: string[];
  images?: string[];
  status: 'active' | 'inactive';
}
