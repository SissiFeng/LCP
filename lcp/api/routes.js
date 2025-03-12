/**
 * LCP API Routes
 * Defines the REST API endpoints for the LCP service
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Validator = require('jsonschema').Validator;
const schemas = require('../validators/schema');

const router = express.Router();
const validator = new Validator();

// Import device service (to be implemented)
const deviceService = require('../services/device-service');

/**
 * Health check endpoint
 * GET /api/lcp/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'LCP API',
    version: '0.1.0'
  });
});

/**
 * Register a device
 * POST /api/lcp/register
 */
router.post('/register', 
  // Validation middleware
  body('device_id').isString().notEmpty(),
  body('protocol').isIn(['MQTT', 'WebSocket', 'REST', 'gRPC']),
  
  async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      // Validate against JSON schema
      const validationResult = validator.validate(req.body, schemas.deviceRegistrationSchema);
      if (!validationResult.valid) {
        return res.status(400).json({ 
          errors: validationResult.errors.map(error => error.stack) 
        });
      }
      
      // Use device service to register device
      const device = await deviceService.registerDevice(req.body);
      
      res.status(201).json({
        message: 'Device registered successfully',
        device_id: device.deviceId
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Submit device data
 * POST /api/lcp/data
 */
router.post('/data',
  // Validation middleware
  body('device_id').isString().notEmpty(),
  body('timestamp').isISO8601(),
  body('parameters').isObject(),
  
  async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      // Validate against JSON schema
      const validationResult = validator.validate(req.body, schemas.dataPointSchema);
      if (!validationResult.valid) {
        return res.status(400).json({ 
          errors: validationResult.errors.map(error => error.stack) 
        });
      }
      
      // Process data (to be implemented)
      // const result = await deviceService.processData(req.body);
      
      // For now, just return success
      res.status(200).json({
        message: 'Data received successfully',
        device_id: req.body.device_id,
        timestamp: req.body.timestamp
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Send command to device
 * POST /api/lcp/control
 */
router.post('/control',
  // Validation middleware
  body('device_id').isString().notEmpty(),
  body('command').isString().notEmpty(),
  
  async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      // Validate against JSON schema
      const validationResult = validator.validate(req.body, schemas.deviceControlSchema);
      if (!validationResult.valid) {
        return res.status(400).json({ 
          errors: validationResult.errors.map(error => error.stack) 
        });
      }
      
      // Send command (to be implemented)
      // const result = await deviceService.sendCommand(req.body);
      
      // For now, just return success
      res.status(200).json({
        message: 'Command sent successfully',
        device_id: req.body.device_id,
        command: req.body.command
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Get device status
 * GET /api/lcp/devices/:deviceId/status
 */
router.get('/devices/:deviceId/status', async (req, res, next) => {
  try {
    const deviceId = req.params.deviceId;
    
    // Get device status (to be implemented)
    // const status = await deviceService.getDeviceStatus(deviceId);
    
    // For now, return mock status
    res.status(200).json({
      device_id: deviceId,
      status: 'online',
      last_seen: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Get device data
 * GET /api/lcp/devices/:deviceId/data
 */
router.get('/devices/:deviceId/data', async (req, res, next) => {
  try {
    const deviceId = req.params.deviceId;
    
    // Get device data (to be implemented)
    // const data = await deviceService.getDeviceData(deviceId);
    
    // For now, return mock data
    res.status(200).json({
      device_id: deviceId,
      timestamp: new Date().toISOString(),
      parameters: {
        temperature: 25.5,
        humidity: 60
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * List all devices
 * GET /api/lcp/devices
 */
router.get('/devices', async (req, res, next) => {
  try {
    // List devices (to be implemented)
    // const devices = await deviceService.listDevices();
    
    // For now, return mock devices
    res.status(200).json({
      devices: [
        {
          device_id: 'device_001',
          protocol: 'MQTT',
          status: 'online'
        },
        {
          device_id: 'device_002',
          protocol: 'WebSocket',
          status: 'offline'
        }
      ]
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
