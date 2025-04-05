import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import config from '../config';

/**
 * Interface for MiniCal authentication credentials
 */
interface MiniCalCredentials {
  apiKey?: string;
  username?: string;
  password?: string;
}

/**
 * Interface for MiniCal configuration options
 */
interface MiniCalConfig {
  baseUrl?: string;
  credentials?: MiniCalCredentials;
  timeout?: number;
}

/**
 * Service for interacting with the MiniCal PMS API
 */
export class MiniCalService {
  private client: AxiosInstance;
  private baseUrl: string;
  private credentials: MiniCalCredentials;

  /**
   * Creates a new MiniCal service instance
   * @param customConfig Optional custom configuration
   */
  constructor(customConfig?: MiniCalConfig) {
    this.baseUrl = customConfig?.baseUrl || 'http://localhost/minical/api';
    this.credentials = customConfig?.credentials || {
      apiKey: process.env.MINICAL_API_KEY,
      username: process.env.MINICAL_USERNAME,
      password: process.env.MINICAL_PASSWORD
    };

    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: customConfig?.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // If API key is available, use it for authentication
        if (this.credentials.apiKey) {
          config.headers['X-API-KEY'] = this.credentials.apiKey;
        }
        // Otherwise use basic authentication
        else if (this.credentials.username && this.credentials.password) {
          config.auth = {
            username: this.credentials.username,
            password: this.credentials.password
          };
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Makes a request to the MiniCal API
   * @param method HTTP method
   * @param endpoint API endpoint
   * @param data Request data
   * @param options Additional request options
   * @returns Promise with the response data
   */
  private async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    options?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.client.request<T>({
        method,
        url: endpoint,
        data: method !== 'GET' ? data : undefined,
        params: method === 'GET' ? data : undefined,
        ...options
      });
      return response.data;
    } catch (error: any) {
      console.error(`MiniCal API error (${method} ${endpoint}):`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Gets all room types from MiniCal
   * @param propertyId Property ID
   * @returns Promise with room types
   */
  async getRoomTypes(propertyId: string) {
    return this.request<any>('GET', `/properties/${propertyId}/room_types`);
  }

  /**
   * Gets all rate plans from MiniCal
   * @param propertyId Property ID
   * @returns Promise with rate plans
   */
  async getRatePlans(propertyId: string) {
    return this.request<any>('GET', `/properties/${propertyId}/rate_plans`);
  }

  /**
   * Gets availability for a property
   * @param propertyId Property ID
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   * @returns Promise with availability data
   */
  async getAvailability(propertyId: string, startDate: string, endDate: string) {
    return this.request<any>('GET', `/properties/${propertyId}/availability`, {
      start_date: startDate,
      end_date: endDate
    });
  }

  /**
   * Gets rates for a property
   * @param propertyId Property ID
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   * @returns Promise with rate data
   */
  async getRates(propertyId: string, startDate: string, endDate: string) {
    return this.request<any>('GET', `/properties/${propertyId}/rates`, {
      start_date: startDate,
      end_date: endDate
    });
  }

  /**
   * Creates a booking in MiniCal
   * @param propertyId Property ID
   * @param bookingData Booking data
   * @returns Promise with booking confirmation
   */
  async createBooking(propertyId: string, bookingData: any) {
    return this.request<any>('POST', `/properties/${propertyId}/bookings`, bookingData);
  }

  /**
   * Updates a booking in MiniCal
   * @param propertyId Property ID
   * @param bookingId Booking ID
   * @param bookingData Updated booking data
   * @returns Promise with updated booking
   */
  async updateBooking(propertyId: string, bookingId: string, bookingData: any) {
    return this.request<any>('PUT', `/properties/${propertyId}/bookings/${bookingId}`, bookingData);
  }

  /**
   * Cancels a booking in MiniCal
   * @param propertyId Property ID
   * @param bookingId Booking ID
   * @returns Promise with cancellation confirmation
   */
  async cancelBooking(propertyId: string, bookingId: string) {
    return this.request<any>('DELETE', `/properties/${propertyId}/bookings/${bookingId}`);
  }

  /**
   * Updates inventory in MiniCal
   * @param propertyId Property ID
   * @param roomTypeId Room type ID
   * @param inventoryData Inventory data
   * @returns Promise with update confirmation
   */
  async updateInventory(propertyId: string, roomTypeId: string, inventoryData: any) {
    return this.request<any>('PUT', `/properties/${propertyId}/room_types/${roomTypeId}/inventory`, inventoryData);
  }

  /**
   * Updates rates in MiniCal
   * @param propertyId Property ID
   * @param ratePlanId Rate plan ID
   * @param rateData Rate data
   * @returns Promise with update confirmation
   */
  async updateRates(propertyId: string, ratePlanId: string, rateData: any) {
    return this.request<any>('PUT', `/properties/${propertyId}/rate_plans/${ratePlanId}/rates`, rateData);
  }

  /**
   * Gets property information from MiniCal
   * @param propertyId Property ID
   * @returns Promise with property data
   */
  async getProperty(propertyId: string) {
    return this.request<any>('GET', `/properties/${propertyId}`);
  }
}
