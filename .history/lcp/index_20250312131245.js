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

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
// const apiRoutes = require('./api/routes');

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'LCP', version: '0.1.0' });
});

// Use API routes
// app.use('/api/lcp', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`LCP Server running on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
