import express from 'express';
import path from 'path';
import cors from 'cors';
import 'reflect-metadata';
import config from './config';
import { initializeDatabase } from './config/database';
import routes from './routes';
import { logger } from './utils/logger';

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', routes);

// Setup wizard route
app.get('/setup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'setup-wizard.html'));
});

// Test booking flow route
app.get('/test-booking-flow', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test-booking-flow.html'));
});

// Serve AI agent interface
app.get('/ai-agent', (req, res) => {
  res.sendFile(path.join(__dirname, 'ai-agent-interface.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: config.env });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Application error:', err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR'
  });
});

// Start server
const startServer = async () => {
  try {
    // Create logs directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }
    
    // Initialize database connection
    await initializeDatabase();
    
    // Start listening
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode`);
      console.log(`Server running on port ${config.port} in ${config.env} mode`);
      console.log(`Setup wizard available at: http://localhost:${config.port}/setup`);
      console.log(`Test booking flow available at: http://localhost:${config.port}/test-booking-flow`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

export { app, startServer };

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}
