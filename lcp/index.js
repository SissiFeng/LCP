/**
 * Laboratory Context Protocol (LCP)
 * Main application entry point
 * 
 * This server provides a standardized interface for laboratory devices
 * to communicate with data processing systems, regardless of their
 * native communication protocols (MQTT, WebSocket, REST API).
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import core components
const AdapterManager = require('./core/adapter-manager');
const authService = require('./auth/auth-service');
const { errorHandlerMiddleware } = require('./errors/error-handler');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize adapter manager
const adapterManager = new AdapterManager({
  mqttOptions: {
    brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    onDataCallback: (dataPoint) => {
      console.log('Received data from MQTT device:', dataPoint.deviceId);
      // Here we would store the data in a database
    }
  },
  webSocketOptions: {},
  restOptions: {}
});

// Connect adapters
adapterManager.connect()
  .then(() => {
    console.log('Adapter manager initialized');
  })
  .catch(err => {
    console.error('Failed to initialize adapter manager:', err);
  });

// Import routes
const apiRoutes = require('./api/routes');

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'LCP', version: '0.1.0' });
});

// Use API routes with authentication middleware
app.use('/api/lcp', 
  // Uncomment to enable API key authentication
  // authService.apiKeyAuthMiddleware(),
  apiRoutes
);

// Error handling middleware
app.use(errorHandlerMiddleware);

// Start the server
const server = app.listen(port, () => {
  console.log(`LCP Server running on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
  console.log(`API available at http://localhost:${port}/api/lcp`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    adapterManager.disconnect()
      .then(() => {
        console.log('Adapter manager disconnected');
        process.exit(0);
      })
      .catch(err => {
        console.error('Error disconnecting adapter manager:', err);
        process.exit(1);
      });
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
