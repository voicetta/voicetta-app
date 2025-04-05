import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import config from '../config';
import { YieldPlanetRoom, YieldPlanetRatePlan, YieldPlanetReservation, YieldPlanetRate, YieldPlanetAvailability } from '../models/yieldPlanet.models';
import { logger } from '../utils/logger';

/**
 * Interface for YieldPlanet authentication credentials
 */
interface YieldPlanetCredentials {
  username?: string;
  password?: string;
  apiKey?: string;
}

/**
 * Interface for YieldPlanet configuration options
 */
interface YieldPlanetConfig {
  apiUrl?: string;
  credentials?: YieldPlanetCredentials;
  mappings?: {
    roomTypes?: Record<string, string>;
    rateTypes?: Record<string, string>;
  };
  timeout?: number;
}

/**
 * Service for interacting with the YieldPlanet Channel Manager API
 */
export class YieldPlanetService {
  private client: AxiosInstance;
  private baseUrl: string;
  private credentials: YieldPlanetCredentials;
  private mappings: {
    roomTypes?: Record<string, string>;
    rateTypes?: Record<string, string>;
  };

  /**
   * Creates a new YieldPlanet service instance
   * @param customConfig Optional custom configuration
   */
  constructor(customConfig?: YieldPlanetConfig) {
    this.baseUrl = customConfig?.apiUrl || config.yieldPlanet.apiUrl;
    this.credentials = customConfig?.credentials || {
      username: config.yieldPlanet.username,
      password: config.yieldPlanet.password
    };
    this.mappings = customConfig?.mappings || {
      roomTypes: {},
      rateTypes: {}
    };

    if (!this.credentials.username || !this.credentials.password) {
      throw new Error('YieldPlanet credentials not configured');
    }

    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: customConfig?.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // Use Basic Authentication
        const auth = Buffer.from(`${this.credentials.username}:${this.credentials.password}`).toString('base64');
        config.headers['Authorization'] = `Basic ${auth}`;
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Makes a request to the YieldPlanet API
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
      const startTime = Date.now();
      
      const response = await this.client.request<T>({
        method,
        url: endpoint,
        data: method !== 'GET' ? data : undefined,
        params: method === 'GET' ? data : undefined,
        ...options
      });
      
      logger.debug(`YieldPlanet API ${method} ${endpoint} completed in ${Date.now() - startTime}ms`);
      
      return response.data;
    } catch (error: any) {
      logger.error(`YieldPlanet API error (${method} ${endpoint}):`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Gets all rooms for a property
   * @param propertyId Property ID
   * @returns Promise with rooms
   */
  async getRooms(propertyId: string): Promise<YieldPlanetRoom[]> {
    return this.request<YieldPlanetRoom[]>('GET', `/properties/${propertyId}/rooms`);
  }

  /**
   * Gets all rate plans for a property
   * @param propertyId Property ID
   * @returns Promise with rate plans
   */
  async getRatePlans(propertyId: string): Promise<YieldPlanetRatePlan[]> {
    return this.request<YieldPlanetRatePlan[]>('GET', `/properties/${propertyId}/rateplans`);
  }

  /**
   * Checks availability for a property
   * @param params Availability parameters
   * @returns Promise with availability data
   */
  async checkAvailability(params: {
    propertyId: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children?: number;
  }): Promise<any> {
    return this.request<any>('GET', `/properties/${params.propertyId}/availability`, params);
  }

  /**
   * Creates a reservation
   * @param reservation Reservation data
   * @returns Promise with created reservation
   */
  async createReservation(reservation: YieldPlanetReservation): Promise<YieldPlanetReservation> {
    return this.request<YieldPlanetReservation>(
      'POST',
      `/properties/${reservation.propertyId}/reservations`,
      reservation
    );
  }

  /**
   * Updates a reservation
   * @param reservationId Reservation ID
   * @param data Update data
   * @returns Promise with updated reservation
   */
  async updateReservation(
    reservationId: string,
    data: Partial<YieldPlanetReservation>
  ): Promise<YieldPlanetReservation> {
    return this.request<YieldPlanetReservation>('PUT', `/reservations/${reservationId}`, data);
  }

  /**
   * Cancels a reservation
   * @param reservationId Reservation ID
   * @returns Promise with cancellation result
   */
  async cancelReservation(reservationId: string): Promise<any> {
    return this.request<any>('DELETE', `/reservations/${reservationId}`);
  }

  /**
   * Updates availability for a room
   * @param propertyId Property ID
   * @param roomId Room ID
   * @param availabilityData Availability data
   * @returns Promise with update result
   */
  async updateAvailability(
    propertyId: string,
    roomId: string,
    availabilityData: YieldPlanetAvailability[]
  ): Promise<any> {
    return this.request<any>(
      'PUT',
      `/properties/${propertyId}/rooms/${roomId}/availability`,
      availabilityData
    );
  }

  /**
   * Updates rates for a room and rate plan
   * @param propertyId Property ID
   * @param roomId Room ID
   * @param ratePlanId Rate plan ID
   * @param rateData Rate data
   * @returns Promise with update result
   */
  async updateRates(
    propertyId: string,
    roomId: string,
    ratePlanId: string,
    rateData: YieldPlanetRate[]
  ): Promise<any> {
    return this.request<any>(
      'PUT',
      `/properties/${propertyId}/rooms/${roomId}/rateplans/${ratePlanId}/rates`,
      rateData
    );
  }

  /**
   * Updates occupancy-based rates for a room and rate plan
   * @param propertyId Property ID
   * @param roomId Room ID
   * @param ratePlanId Rate plan ID
   * @param rateData Occupancy-based rate data
   * @returns Promise with update result
   */
  async updateOccupancyRates(
    propertyId: string,
    roomId: string,
    ratePlanId: string,
    rateData: {
      date: string;
      occupancy: number;
      price: number;
      currency: string;
      restrictions?: {
        minStay?: number;
        maxStay?: number;
        closedToArrival?: boolean;
        closedToDeparture?: boolean;
      };
    }[]
  ): Promise<any> {
    return this.request<any>(
      'PUT',
      `/properties/${propertyId}/rooms/${roomId}/rateplans/${ratePlanId}/occupancy-rates`,
      rateData
    );
  }

  /**
   * Gets property details
   * @param propertyId Property ID
   * @returns Promise with property details
   */
  async getProperty(propertyId: string): Promise<any> {
    return this.request<any>('GET', `/properties/${propertyId}`);
  }

  /**
   * Gets all properties
   * @returns Promise with properties
   */
  async getProperties(): Promise<any[]> {
    return this.request<any[]>('GET', '/properties');
  }

  /**
   * Maps a room ID using configured mappings
   * @param roomId Original room ID
   * @returns Mapped room ID
   */
  mapRoomId(roomId: string): string {
    return this.mappings.roomTypes?.[roomId] || roomId;
  }

  /**
   * Maps a rate plan ID using configured mappings
   * @param ratePlanId Original rate plan ID
   * @returns Mapped rate plan ID
   */
  mapRatePlanId(ratePlanId: string): string {
    return this.mappings.rateTypes?.[ratePlanId] || ratePlanId;
  }
}
