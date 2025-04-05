import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

interface Config {
  env: string;
  port: number;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  yieldPlanet: {
    apiUrl: string;
    username: string;
    password: string;
    hotelId: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  logging: {
    level: string;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'voicetta',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  yieldPlanet: {
    apiUrl: process.env.YIELDPLANET_API_URL || 'https://secure.yieldplanet.com/XmlServices/ChannelManager/v3.6.asmx',
    username: process.env.YIELDPLANET_USERNAME || '',
    password: process.env.YIELDPLANET_PASSWORD || '',
    hotelId: process.env.YIELDPLANET_HOTEL_ID || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;
