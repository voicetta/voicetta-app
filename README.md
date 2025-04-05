# Voicetta MiniCal-YieldPlanet Integration Deployment Guide

## Overview

This deployment guide provides step-by-step instructions for deploying the Voicetta integration between MiniCal Property Management System (PMS) and YieldPlanet Channel Manager in various environments. Follow these instructions to successfully deploy the application in development, staging, or production environments.

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Prerequisites](#prerequisites)
3. [Development Environment Deployment](#development-environment-deployment)
4. [Production Environment Deployment](#production-environment-deployment)
5. [Docker Deployment](#docker-deployment)
6. [Cloud Deployment](#cloud-deployment)
7. [Continuous Integration/Continuous Deployment](#continuous-integrationcontinuous-deployment)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Backup and Recovery](#backup-and-recovery)
10. [Scaling Considerations](#scaling-considerations)
11. [Security Considerations](#security-considerations)
12. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Deployment Options

The Voicetta MiniCal-YieldPlanet integration can be deployed in several ways:

1. **Direct Server Deployment**: Install directly on a server
2. **Docker Deployment**: Deploy using Docker containers
3. **Cloud Deployment**: Deploy to cloud platforms like AWS, Azure, or Google Cloud
4. **Serverless Deployment**: Deploy as serverless functions (limited functionality)

Choose the deployment option that best fits your infrastructure and requirements.

## Prerequisites

Before deploying, ensure you have:

1. **Access Credentials**:
   - MiniCal PMS API credentials
   - YieldPlanet API credentials
   - Database credentials
   - Server/cloud platform access

2. **Software Requirements**:
   - Node.js 16.x or higher
   - PostgreSQL 12.x or higher
   - Git
   - Docker (for container deployment)
   - npm or yarn

3. **Hardware Requirements**:
   - Minimum 2GB RAM (4GB recommended)
   - 20GB disk space
   - 1 CPU core (2+ recommended)

4. **Network Requirements**:
   - Outbound access to MiniCal API
   - Outbound access to YieldPlanet API
   - Inbound access for API consumers

## Development Environment Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/novumhouse/voicetta-app.git
cd voicetta-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the src directory:

```bash
cp src/.env.example src/.env
```

Edit the `.env` file with your development configuration.

### 4. Set Up the Database

```bash
# Create the database
createdb voicetta_dev

# Run migrations
npm run migration:run
```

### 5. Start the Development Server

```bash
npm run dev
```

The development server will be available at `http://localhost:3000` with hot-reloading enabled.

## Production Environment Deployment

### 1. Prepare the Server

Update the server and install required packages:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y nodejs npm postgresql postgresql-contrib git
```

### 2. Clone the Repository

```bash
git clone https://github.com/novumhouse/voicetta-app.git
cd voicetta-app
```

### 3. Install Dependencies

```bash
npm install --production
```

### 4. Configure Environment Variables

Create a `.env` file in the src directory:

```bash
cp src/.env.example src/.env
```

Edit the `.env` file with your production configuration.

### 5. Set Up the Database

```bash
# Create the database
sudo -u postgres createdb voicetta_prod

# Create a database user
sudo -u postgres createuser voicetta_user
sudo -u postgres psql -c "ALTER USER voicetta_user WITH ENCRYPTED PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE voicetta_prod TO voicetta_user;"

# Update .env with database credentials
# DB_USER=voicetta_user
# DB_PASSWORD=your_secure_password
# DB_NAME=voicetta_prod
```

### 6. Build the Application

```bash
npm run build
```

### 7. Run Database Migrations

```bash
npm run migration:run
```

### 8. Set Up Process Manager (PM2)

Install PM2:

```bash
npm install -g pm2
```

Create a PM2 configuration file (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [{
    name: "voicetta-app",
    script: "./dist/server.js",
    instances: "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
    }
  }]
};
```

Start the application with PM2:

```bash
pm2 start ecosystem.config.js
```

Set up PM2 to start on system boot:

```bash
pm2 startup
pm2 save
```

### 9. Set Up Nginx as Reverse Proxy

Install Nginx:

```bash
sudo apt install -y nginx
```

Create an Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/voicetta-app
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/voicetta-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 10. Set Up SSL with Let's Encrypt

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain and install SSL certificate:

```bash
sudo certbot --nginx -d your-domain.com
```

## Docker Deployment

### 1. Create a Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### 2. Create a Docker Compose File

Create a `docker-compose.yml` file:

```yaml
version: '3'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=5432
      - DB_NAME=voicetta
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - YIELDPLANET_API_URL=https://secure.yieldplanet.com/XmlServices/ChannelManager/v3.6.asmx
      - YIELDPLANET_USERNAME=your_username
      - YIELDPLANET_PASSWORD=your_password
      - YIELDPLANET_HOTEL_ID=your_hotel_id
      - JWT_SECRET=your_jwt_secret
      - JWT_EXPIRES_IN=1d
      - LOG_LEVEL=info
    depends_on:
      - db
    restart: always

  db:
    image: postgres:12-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=voicetta
    restart: always

volumes:
  postgres_data:
```

### 3. Build and Run with Docker Compose

```bash
docker-compose up -d
```

### 4. Run Migrations

```bash
docker-compose exec app npm run migration:run
```

## Cloud Deployment

### AWS Deployment

#### 1. Set Up AWS Resources

1. Create an RDS PostgreSQL instance
2. Create an EC2 instance (t3.small or larger recommended)
3. Configure security groups to allow necessary traffic
4. Set up an Elastic IP and associate it with the EC2 instance

#### 2. Deploy to EC2

Follow the [Production Environment Deployment](#production-environment-deployment) steps on your EC2 instance.

#### 3. Set Up AWS Application Load Balancer (Optional)

1. Create a target group with your EC2 instance
2. Create an Application Load Balancer
3. Configure listeners and routing
4. Set up SSL certificate through AWS Certificate Manager

### Azure Deployment

#### 1. Set Up Azure Resources

1. Create an Azure Database for PostgreSQL
2. Create an Azure Virtual Machine
3. Configure network security groups

#### 2. Deploy to Azure VM

Follow the [Production Environment Deployment](#production-environment-deployment) steps on your Azure VM.

#### 3. Set Up Azure Application Gateway (Optional)

1. Create a backend pool with your VM
2. Configure listeners and routing rules
3. Set up SSL certificate

### Google Cloud Platform Deployment

#### 1. Set Up GCP Resources

1. Create a Cloud SQL PostgreSQL instance
2. Create a Compute Engine VM instance
3. Configure firewall rules

#### 2. Deploy to GCP VM

Follow the [Production Environment Deployment](#production-environment-deployment) steps on your GCP VM.

#### 3. Set Up Google Cloud Load Balancing (Optional)

1. Create a backend service with your VM
2. Configure frontend and routing
3. Set up SSL certificate

## Continuous Integration/Continuous Deployment

### GitHub Actions CI/CD

Create a `.github/workflows/deploy.yml` file:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/voicetta-app
            git pull
            npm install --production
            npm run build
            npm run migration:run
            pm2 restart voicetta-app
```

Configure GitHub repository secrets:
- `HOST`: Your server IP or domain
- `USERNAME`: SSH username
- `SSH_KEY`: Private SSH key for authentication

## Post-Deployment Verification

After deployment, verify that the application is working correctly:

### 1. Check Server Status

```bash
# Check if the application is running
pm2 status

# Check logs for errors
pm2 logs voicetta-app
```

### 2. Verify API Endpoints

```bash
# Check health endpoint
curl http://your-domain.com/health

# Check API endpoint (requires authentication)
curl -H "Authorization: Bearer your-jwt-token" http://your-domain.com/api/properties
```

### 3. Run End-to-End Test

Access the test interface at:

```
http://your-domain.com/test-booking-flow
```

Run the test to verify that the integration with MiniCal and YieldPlanet is working correctly.

## Backup and Recovery

### Database Backup

Set up regular PostgreSQL backups:

```bash
# Create a backup script
cat > /path/to/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/path/to/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="voicetta_prod"
DB_USER="voicetta_user"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/$DB_NAME\_$TIMESTAMP.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql" -type f -mtime +30 -delete
EOF

# Make the script executable
chmod +x /path/to/backup.sh

# Set up a daily cron job
(crontab -l 2>/dev/null; echo "0 2 * * * /path/to/backup.sh") | crontab -
```

### Database Recovery

To restore from a backup:

```bash
psql -U voicetta_user voicetta_prod < /path/to/backups/voicetta_prod_TIMESTAMP.sql
```

## Scaling Considerations

### Horizontal Scaling

To handle increased load, you can scale the application horizontally:

1. **Load Balancer**: Set up a load balancer to distribute traffic across multiple instances
2. **Multiple Instances**: Deploy multiple instances of the application
3. **Database Scaling**: Consider database replication or sharding for high database load

### Vertical Scaling

For simpler scaling, you can increase resources on a single server:

1. **Increase RAM**: Upgrade to a server with more RAM
2. **Increase CPU**: Add more CPU cores
3. **Faster Storage**: Use SSD storage for the database

## Security Considerations

### Secure Your Application

1. **Keep Dependencies Updated**:
   ```bash
   npm audit
   npm update
   ```

2. **Set Up a Firewall**:
   ```bash
   sudo ufw allow ssh
   sudo ufw allow http
   sudo ufw allow https
   sudo ufw enable
   ```

3. **Secure Nginx**:
   - Enable HTTP/2
   - Configure secure SSL settings
   - Set up security headers

4. **Secure PostgreSQL**:
   - Use strong passwords
   - Limit network access
   - Enable SSL connections

5. **Implement Rate Limiting**:
   - Configure rate limiting in Nginx
   - Implement API rate limiting

6. **Regular Security Audits**:
   - Conduct regular security audits
   - Use automated security scanning tools

## Monitoring and Maintenance

### Monitoring

Set up monitoring to track application health and performance:

1. **Server Monitoring**:
   - Install and configure Prometheus and Grafana
   - Monitor CPU, memory, disk, and network usage

2. **Application Monitoring**:
   - Implement health check endpoints
   - Set up error tracking with Sentry or similar tools

3. **Log Monitoring**:
   - Centralize logs with ELK Stack or similar
   - Set up alerts for critical errors

### Maintenance

Regular maintenance tasks:

1. **Updates**:
   - Regularly update Node.js
   - Keep npm packages updated
   - Update the operating system

2. **Database Maintenance**:
   - Run regular VACUUM operations
   - Monitor database size and performance
   - Optimize queries as needed

3. **Backup Verification**:
   - Regularly test backup restoration
   - Verify backup integrity

4. **SSL Certificate Renewal**:
   - Ensure automatic renewal of SSL certificates
   - Monitor certificate expiration dates

---

© 2025 Voicetta. All rights reserved.


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
- Phone: +1 650 629 7111

### Reporting Issues

If you encounter any issues, please report them on our GitHub repository:

https://github.com/novumhouse/voicetta-app/issues

### Feature Requests

For feature requests, please submit them on our GitHub repository or contact our support team.

---

© 2025 Voicetta. All rights reserved.


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
