# Voicetta App - Requirements Analysis

## Overview
This document outlines the requirements and analysis for developing the Voicetta App, which aims to connect MiniCal PMS with YieldPlanet Channel Manager to expand hotel connectivity options. The main goal is to leverage YieldPlanet's 500+ connections to hotel systems, allowing Voicetta to focus on product quality and building customer trust.

## Repository Analysis

### MiniCal PMS
- **Repository**: https://github.com/minical/minical
- **Description**: An open-source Property Management System (PMS) with extension management capabilities
- **Key Features**:
  - Online Booking Engine integration
  - Inventory management
  - CRM functionality
  - Calendar interface
  - Payment processing
- **Architecture**: Based on CodeIgniter PHP framework
- **Extension System**: Supports custom extensions through a marketplace

### MiniCal Online Booking Engine
- **Repository**: https://github.com/minical/online-booking-engine
- **Description**: Customer-facing booking application that automates booking creation
- **Key Features**:
  - Embeddable code for existing websites
  - Customizable booking form fields
  - Automated email notifications
  - Multiple currency and language support
  - Real-time channel synchronization
  - Credit card detail capture
- **Integration**: Designed as an extension for MiniCal PMS

### Voicetta Backend
- **Repository**: https://github.com/novumhouse/backend-be-voicetta
- **Description**: Node.js/Express backend for the Voicetta Booking Engine middleware
- **Key Components**:
  - API endpoints for reservations, properties, and availability
  - YieldPlanet service integration
  - Database models for properties, reservations, and request logs
  - Error handling middleware
- **Data Models**:
  - **Property**: Contains hotel information, YieldPlanet configuration, and room types
  - **Reservation**: Manages booking details, guest information, and YieldPlanet reservation IDs
  - **RequestLog**: Tracks API requests and responses for debugging

### YieldPlanet Integration
- **API Version**: 1.31
- **API URL**: https://secure.yieldplanet.com/XmlServices/ChannelManager/v3.6.asmx
- **Key Methods**:
  - GetRooms: Retrieves room information from YieldPlanet
  - GetRatePlans: Retrieves rate plan information
  - SetRate: Updates room rates
  - SetOccupancyRates: Updates occupancy-based rates
- **Authentication**: Username/password credentials
- **Data Flow**: Voicetta backend connects to YieldPlanet API to synchronize inventory and bookings

## Integration Requirements

### MiniCal Connector
- Develop an API client for MiniCal PMS
- Implement authentication mechanism
- Create data mapping layer between MiniCal and middleware
- Implement inventory management functions
- Implement booking management functions

### YieldPlanet Integration
- Leverage existing YieldPlanet service in Voicetta backend
- Ensure proper credential management
- Implement room and rate plan mapping
- Develop inventory synchronization
- Create booking flow integration

### Middleware Architecture
- Design a flexible connector architecture for future PMS compatibility
- Create an AI connector layer for MiniCal PMS
- Implement data transformation between systems
- Develop error handling and retry mechanisms
- Create logging and monitoring capabilities

### Setup Wizard
- Design user-friendly setup process for hotels
- Implement MiniCal connection configuration
- Create YieldPlanet connection setup
- Develop validation and testing tools
- Create user guidance system

## Technical Considerations

### Development Stack
- **Backend**: Node.js/Express (as used in existing Voicetta backend)
- **Database**: PostgreSQL for data persistence
- **Authentication**: JWT for API security
- **Error Handling**: Comprehensive error management with logging
- **Testing**: Unit and integration tests

### Integration Approach
1. Connect to MiniCal through its API
2. Transform data to match YieldPlanet requirements
3. Use existing YieldPlanet service to communicate with YieldPlanet API
4. Implement bidirectional synchronization for inventory and bookings
5. Create a simple setup wizard for hotels using MiniCal

### Challenges and Considerations
- Ensuring data consistency between systems
- Handling different data models and formats
- Managing authentication and security
- Implementing proper error handling and recovery
- Creating a user-friendly setup process for non-technical hoteliers

## Next Steps
1. Set up development environment
2. Design detailed middleware architecture
3. Implement MiniCal connector
4. Integrate with YieldPlanet
5. Develop setup wizard
6. Test end-to-end booking flow
7. Create documentation and deployment guide
