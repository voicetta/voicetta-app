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
