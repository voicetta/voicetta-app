# Middleware Architecture Design

## Overview

This document outlines the architecture for the middleware that will connect MiniCal PMS with YieldPlanet Channel Manager. The middleware will serve as a bridge between these two systems, enabling seamless synchronization of hotel inventory, rates, and bookings.

## Architecture Diagram

```
┌─────────────────┐     ┌───────────────────────────────────────┐     ┌─────────────────┐
│                 │     │                                       │     │                 │
│                 │     │           Voicetta Middleware         │     │                 │
│                 │     │                                       │     │                 │
│                 │     │  ┌─────────────┐     ┌─────────────┐  │     │                 │
│                 │     │  │             │     │             │  │     │                 │
│   MiniCal PMS   │◄────┼──┤  MiniCal    │     │ YieldPlanet │──┼────►│  YieldPlanet   │
│                 │     │  │  Connector  │     │  Service    │  │     │ Channel Manager │
│                 │     │  │             │     │             │  │     │                 │
│                 │     │  └──────┬──────┘     └──────┬──────┘  │     │                 │
│                 │     │         │                   │         │     │                 │
└─────────────────┘     │  ┌──────▼───────────────────▼──────┐  │     └─────────────────┘
                        │  │                                  │  │
                        │  │        Data Transformation       │  │
                        │  │                                  │  │
                        │  └──────────────┬──────────────────┘  │
                        │                 │                     │
                        │  ┌──────────────▼──────────────────┐  │
                        │  │                                  │  │
                        │  │         Database Storage         │  │
                        │  │                                  │  │
                        │  └──────────────────────────────────┘  │
                        │                                       │
                        │  ┌──────────────────────────────────┐  │
                        │  │                                  │  │
                        │  │           API Layer              │  │
                        │  │                                  │  │
                        │  └──────────────────────────────────┘  │
                        │                                       │
                        └───────────────────────────────────────┘
```

## Components

### 1. MiniCal Connector

The MiniCal Connector is responsible for communicating with the MiniCal PMS API.

**Responsibilities:**
- Authentication with MiniCal PMS
- Fetching room types and rate plans from MiniCal
- Retrieving inventory and availability data
- Sending booking information to MiniCal
- Handling MiniCal API errors and retries

**Key Classes:**
- `MiniCalService`: Main service for interacting with MiniCal API
- `MiniCalAuthenticator`: Handles authentication with MiniCal
- `MiniCalMapper`: Maps MiniCal data structures to internal models

### 2. YieldPlanet Service

The YieldPlanet Service handles communication with the YieldPlanet Channel Manager API.

**Responsibilities:**
- Authentication with YieldPlanet API
- Sending room and rate plan information to YieldPlanet
- Updating inventory and rates in YieldPlanet
- Receiving booking information from YieldPlanet
- Handling YieldPlanet API errors and retries

**Key Classes:**
- `YieldPlanetService`: Main service for interacting with YieldPlanet API
- `YieldPlanetAuthenticator`: Handles authentication with YieldPlanet
- `YieldPlanetMapper`: Maps internal models to YieldPlanet data structures

### 3. Data Transformation Layer

The Data Transformation Layer converts data between MiniCal and YieldPlanet formats.

**Responsibilities:**
- Converting MiniCal room types to YieldPlanet room types
- Mapping MiniCal rate plans to YieldPlanet rate plans
- Transforming availability and inventory data
- Converting booking information between systems
- Handling data validation and error checking

**Key Classes:**
- `DataTransformer`: Core transformation logic
- `ValidationService`: Validates data integrity during transformation
- `MappingService`: Manages mappings between MiniCal and YieldPlanet entities

### 4. Database Storage

The Database Storage component persists data needed for the integration.

**Responsibilities:**
- Storing property configurations
- Maintaining room type and rate plan mappings
- Logging transactions and API calls
- Storing booking information
- Managing synchronization state

**Key Entities:**
- `Property`: Hotel property information
- `Reservation`: Booking details
- `RequestLog`: API request/response logs
- `Mapping`: Entity mappings between systems
- `SyncState`: Synchronization state information

### 5. API Layer

The API Layer provides endpoints for the setup wizard and external systems.

**Responsibilities:**
- Exposing RESTful APIs for configuration
- Providing endpoints for booking creation
- Handling webhook callbacks
- Managing authentication and authorization
- Implementing rate limiting and security

**Key Controllers:**
- `PropertyController`: Manages property configurations
- `ReservationController`: Handles booking operations
- `AvailabilityController`: Provides availability checking
- `SetupController`: Manages the setup process
- `WebhookController`: Processes incoming webhooks

## Data Flow

### 1. Initial Setup Flow

1. Hotel administrator initiates setup through the wizard
2. Middleware authenticates with MiniCal PMS
3. Room types and rate plans are fetched from MiniCal
4. Administrator maps MiniCal entities to YieldPlanet entities
5. Mappings are stored in the database
6. Initial inventory and rates are synchronized to YieldPlanet

### 2. Inventory Synchronization Flow

1. Inventory changes in MiniCal PMS
2. MiniCal Connector detects changes through polling or webhooks
3. Data is transformed to YieldPlanet format
4. YieldPlanet Service updates inventory in Channel Manager
5. Synchronization status is logged

### 3. Booking Flow

1. Booking is created through a channel connected to YieldPlanet
2. YieldPlanet sends booking information to middleware
3. Booking data is transformed to MiniCal format
4. MiniCal Connector creates booking in MiniCal PMS
5. Booking confirmation is sent back to YieldPlanet
6. Booking details are stored in the database

## Error Handling Strategy

1. **Retry Mechanism**: Implement exponential backoff for transient errors
2. **Circuit Breaker**: Prevent cascading failures when services are down
3. **Dead Letter Queue**: Store failed operations for later processing
4. **Comprehensive Logging**: Log all API calls with request/response details
5. **Alerting**: Notify administrators of critical failures
6. **Fallback Mechanisms**: Define fallback behavior when services are unavailable

## Security Considerations

1. **Authentication**: Secure API access with JWT tokens
2. **Authorization**: Implement role-based access control
3. **Data Encryption**: Encrypt sensitive data in transit and at rest
4. **API Keys**: Securely store and manage API credentials
5. **Input Validation**: Validate all incoming data to prevent injection attacks
6. **Rate Limiting**: Protect against DoS attacks

## Scalability Considerations

1. **Stateless Design**: Enable horizontal scaling of the middleware
2. **Connection Pooling**: Efficiently manage database connections
3. **Caching**: Implement caching for frequently accessed data
4. **Asynchronous Processing**: Use message queues for non-blocking operations
5. **Database Indexing**: Optimize database queries for performance

## Monitoring and Observability

1. **Health Checks**: Implement endpoints to verify system health
2. **Metrics Collection**: Track API response times and error rates
3. **Logging**: Implement structured logging for easier analysis
4. **Tracing**: Add request tracing for debugging complex flows
5. **Dashboards**: Create monitoring dashboards for system status

## Implementation Plan

1. Implement core data models and database schema
2. Develop MiniCal Connector with authentication and basic operations
3. Enhance YieldPlanet Service with additional methods
4. Build Data Transformation Layer with mapping capabilities
5. Implement API endpoints for configuration and operations
6. Develop error handling and retry mechanisms
7. Add monitoring and observability features
8. Create setup wizard interface
