# Voicetta MiniCal-YieldPlanet Integration Documentation

## Overview

This documentation provides comprehensive information about the Voicetta integration between MiniCal Property Management System (PMS) and YieldPlanet Channel Manager. This integration enables hotels using MiniCal PMS to connect with YieldPlanet's 500+ booking channels, allowing for seamless inventory synchronization and reservation management.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Requirements](#system-requirements)
3. [Installation Guide](#installation-guide)
4. [Configuration](#configuration)
5. [Setup Wizard](#setup-wizard)
6. [Testing](#testing)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)
10. [Support](#support)

## Architecture Overview

The Voicetta integration uses a middleware architecture to connect MiniCal PMS with YieldPlanet Channel Manager. The middleware handles data transformation, synchronization, and communication between the two systems.

### Key Components

- **MiniCal Connector**: Communicates with MiniCal PMS API to fetch and update data
- **YieldPlanet Connector**: Communicates with YieldPlanet Channel Manager API
- **Data Transformation Layer**: Converts data between MiniCal and YieldPlanet formats
- **Database Storage**: Persists configuration, mappings, and transaction logs
- **API Layer**: Provides endpoints for setup, configuration, and operations
- **Setup Wizard**: User-friendly interface for configuring the integration

### Data Flow

1. **Inventory Synchronization**: Room availability is fetched from MiniCal, transformed, and sent to YieldPlanet
2. **Rate Synchronization**: Room rates are fetched from MiniCal, transformed, and sent to YieldPlanet
3. **Booking Flow**: Reservations created through YieldPlanet channels are sent to MiniCal PMS

## System Requirements

### Server Requirements

- Node.js 16.x or higher
- PostgreSQL 12.x or higher
- 2GB RAM minimum (4GB recommended)
- 20GB disk space

### MiniCal Requirements

- MiniCal PMS version 2.0 or higher
- API access enabled
- Administrator credentials

### YieldPlanet Requirements

- YieldPlanet Channel Manager account
- API credentials (username and API key)

## Installation Guide

### Prerequisites

Before installation, ensure you have:

1. Node.js and npm installed
2. PostgreSQL database server running
3. MiniCal PMS API credentials
4. YieldPlanet API credentials

### Installation Steps

1. **Clone the repository**

```bash
git clone https://github.com/novumhouse/voicetta-app.git
cd voicetta-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the src directory based on the `.env.example` template:

```bash
cp src/.env.example src/.env
```

Edit the `.env` file with your specific configuration:

```
NODE_ENV=production
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voicetta
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# YieldPlanet API Configuration
YIELDPLANET_API_URL=https://secure.yieldplanet.com/XmlServices/ChannelManager/v3.6.asmx
YIELDPLANET_USERNAME=your_username
YIELDPLANET_PASSWORD=your_password
YIELDPLANET_HOTEL_ID=your_hotel_id

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d

# Logging
LOG_LEVEL=info
```

4. **Create the database**

```bash
createdb voicetta
```

5. **Build the application**

```bash
npm run build
```

6. **Run database migrations**

```bash
npm run migration:run
```

7. **Start the application**

```bash
npm start
```

The application will be available at `http://localhost:3000` (or the port you configured).

## Configuration

### Database Configuration

The application uses PostgreSQL for data storage. You can configure the database connection in the `.env` file:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=voicetta
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

### YieldPlanet Configuration

Configure your YieldPlanet API credentials in the `.env` file:

```
YIELDPLANET_API_URL=https://secure.yieldplanet.com/XmlServices/ChannelManager/v3.6.asmx
YIELDPLANET_USERNAME=your_username
YIELDPLANET_PASSWORD=your_password
YIELDPLANET_HOTEL_ID=your_hotel_id
```

### JWT Configuration

For secure API access, configure JWT settings:

```
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d
```

### Logging Configuration

Configure logging level in the `.env` file:

```
LOG_LEVEL=info
```

Available levels: `error`, `warn`, `info`, `debug`

## Setup Wizard

The Setup Wizard provides a user-friendly interface for configuring the integration between MiniCal PMS and YieldPlanet Channel Manager.

### Accessing the Setup Wizard

Once the application is running, access the Setup Wizard at:

```
http://your-server:3000/setup
```

### Setup Process

The Setup Wizard guides you through the following steps:

1. **Welcome**: Introduction to the setup process
2. **Select Property**: Choose the MiniCal property to connect
3. **YieldPlanet Credentials**: Enter YieldPlanet API credentials
4. **Map Room Types**: Match MiniCal room types with YieldPlanet room types
5. **Map Rate Plans**: Match MiniCal rate plans with YieldPlanet rate plans
6. **Initial Synchronization**: Perform the initial data synchronization
7. **Completion**: Confirmation of successful setup

### Room Type Mapping

Room type mapping is crucial for correct inventory synchronization. Ensure that you map MiniCal room types to the corresponding YieldPlanet room types based on similar characteristics (capacity, amenities, etc.).

### Rate Plan Mapping

Rate plan mapping ensures that pricing is correctly synchronized. Map MiniCal rate plans to YieldPlanet rate plans with similar characteristics (cancellation policies, inclusions, etc.).

## Testing

### End-to-End Booking Flow Test

The application includes an end-to-end test to validate the integration between MiniCal and YieldPlanet.

#### Accessing the Test Interface

Access the test interface at:

```
http://your-server:3000/test-booking-flow
```

#### Test Process

The test validates the following integration points:

1. Inventory synchronization from MiniCal to YieldPlanet
2. Rate synchronization from MiniCal to YieldPlanet
3. Reservation creation from YieldPlanet to MiniCal
4. Database storage of synchronized data

#### Running the Test via API

You can also run the test programmatically via the API:

```bash
curl -X POST http://your-server:3000/api/test/booking-flow \
  -H "Content-Type: application/json" \
  -d '{"propertyId": "your-property-id"}'
```

## API Reference

### Authentication

All API endpoints require authentication using JWT tokens.

To authenticate, include the JWT token in the Authorization header:

```
Authorization: Bearer your-jwt-token
```

### Properties API

#### Get All Properties

```
GET /api/properties
```

Response:

```json
[
  {
    "id": "property-id",
    "name": "Property Name",
    "address": "Property Address",
    "city": "City",
    "country": "Country",
    "roomTypes": [...]
  }
]
```

#### Get Property by ID

```
GET /api/properties/:id
```

Response:

```json
{
  "id": "property-id",
  "name": "Property Name",
  "address": "Property Address",
  "city": "City",
  "country": "Country",
  "roomTypes": [...]
}
```

### Reservations API

#### Get All Reservations

```
GET /api/reservations
```

#### Get Reservation by ID

```
GET /api/reservations/:id
```

#### Create Reservation

```
POST /api/reservations
```

Request Body:

```json
{
  "propertyId": "property-id",
  "roomTypeId": "room-type-id",
  "guestName": "Guest Name",
  "guestEmail": "guest@example.com",
  "checkInDate": "2023-01-01",
  "checkOutDate": "2023-01-03",
  "adults": 2,
  "children": 0,
  "totalPrice": 200,
  "currency": "USD"
}
```

#### Cancel Reservation

```
POST /api/reservations/:id/cancel
```

### Setup API

#### Check Setup Status

```
GET /api/setup/status/:propertyId
```

#### Set YieldPlanet Credentials

```
POST /api/setup/credentials/:propertyId
```

Request Body:

```json
{
  "username": "your-username",
  "apiKey": "your-api-key"
}
```

#### Get Room Types

```
GET /api/setup/room-types/:propertyId
```

#### Save Room Type Mappings

```
POST /api/setup/room-type-mappings/:propertyId
```

Request Body:

```json
{
  "mappings": {
    "minical-room-id-1": "yieldplanet-room-id-1",
    "minical-room-id-2": "yieldplanet-room-id-2"
  }
}
```

#### Get Rate Plans

```
GET /api/setup/rate-plans/:propertyId
```

#### Save Rate Plan Mappings

```
POST /api/setup/rate-plan-mappings/:propertyId
```

Request Body:

```json
{
  "mappings": {
    "minical-rate-id-1": "yieldplanet-rate-id-1",
    "minical-rate-id-2": "yieldplanet-rate-id-2"
  }
}
```

#### Perform Initial Synchronization

```
POST /api/setup/initial-sync/:propertyId
```

Request Body:

```json
{
  "startDate": "2023-01-01",
  "endDate": "2023-12-31"
}
```

### Test API

#### Run Booking Flow Test

```
POST /api/test/booking-flow
```

Request Body:

```json
{
  "propertyId": "property-id"
}
```

## Troubleshooting

### Common Issues

#### Connection Issues with MiniCal

If you experience connection issues with MiniCal:

1. Verify that your MiniCal API credentials are correct
2. Check that the MiniCal API is accessible from your server
3. Ensure that the MiniCal API version is compatible

#### Connection Issues with YieldPlanet

If you experience connection issues with YieldPlanet:

1. Verify that your YieldPlanet API credentials are correct
2. Check that the YieldPlanet API is accessible from your server
3. Ensure that your YieldPlanet account is active

#### Synchronization Issues

If inventory or rates are not synchronizing correctly:

1. Check the room type and rate plan mappings
2. Verify that the data exists in MiniCal
3. Check the logs for any error messages

### Logging

The application logs are stored in the `logs` directory:

- `logs/error.log`: Contains error-level logs
- `logs/combined.log`: Contains all logs

You can adjust the log level in the `.env` file:

```
LOG_LEVEL=debug
```

### Database Issues

If you experience database issues:

1. Verify that the PostgreSQL server is running
2. Check that the database credentials are correct
3. Ensure that the database schema is up to date by running migrations:

```bash
npm run migration:run
```

## FAQ

### General Questions

#### Q: How often is inventory synchronized?

A: By default, inventory is synchronized every 15 minutes. This can be configured in the application settings.

#### Q: Can I connect multiple MiniCal properties to YieldPlanet?

A: Yes, you can connect multiple MiniCal properties to YieldPlanet. Each property requires its own configuration.

#### Q: What happens if YieldPlanet is temporarily unavailable?

A: The system will retry failed synchronization attempts using an exponential backoff strategy. Failed operations are logged and can be manually retried if needed.

### Technical Questions

#### Q: Can I customize the data mapping between MiniCal and YieldPlanet?

A: Yes, the data mapping can be customized by modifying the mapper classes in the codebase.

#### Q: How can I extend the integration to support additional features?

A: The integration is designed to be extensible. You can add new functionality by extending the existing services and controllers.

#### Q: Is the integration compatible with other channel managers?

A: The integration is specifically designed for YieldPlanet, but the architecture can be extended to support other channel managers by implementing additional connector classes.

## Support

### Contact Information

For support, please contact:

- Email: hi@voicetta.com
- Phone: +1-123-456-7890

### Reporting Issues

If you encounter any issues, please report them on our GitHub repository:

https://github.com/novumhouse/voicetta-app/issues

### Feature Requests

For feature requests, please submit them on our GitHub repository or contact our support team.

---

© 2025 Voicetta. All rights reserved.
