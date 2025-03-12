/**
 * JSON Schema Validation
 * Defines the validation schemas for LCP data structures
 */

// Device Registration Schema
const deviceRegistrationSchema = {
  type: 'object',
  required: ['device_id', 'protocol'],
  properties: {
    device_id: { type: 'string', minLength: 1 },
    protocol: { 
      type: 'string', 
      enum: ['MQTT', 'WebSocket', 'REST', 'gRPC'] 
    },
    connection_details: {
      type: 'object',
      properties: {
        // MQTT specific properties
        mqtt_topics: {
          type: 'object',
          properties: {
            data: { type: 'string' },
            control: { type: 'string' }
          }
        },
        // WebSocket specific properties
        websocket_url: { type: 'string' },
        // REST specific properties
        base_url: { type: 'string' },
        auth_token: { type: 'string' },
        // Common properties
        username: { type: 'string' },
        password: { type: 'string' }
      }
    },
    metadata: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        manufacturer: { type: 'string' },
        model: { type: 'string' },
        serial_number: { type: 'string' },
        capabilities: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    },
    status: {
      type: 'string',
      enum: ['online', 'offline', 'error', 'maintenance']
    }
  }
};

// Data Point Schema
const dataPointSchema = {
  type: 'object',
  required: ['device_id', 'timestamp', 'parameters'],
  properties: {
    device_id: { type: 'string', minLength: 1 },
    timestamp: { type: 'string', format: 'date-time' },
    protocol: { 
      type: 'string', 
      enum: ['MQTT', 'WebSocket', 'REST', 'gRPC'] 
    },
    parameters: {
      type: 'object',
      additionalProperties: true
    },
    experiment_id: { type: 'string' }
  }
};

// Device Control Schema
const deviceControlSchema = {
  type: 'object',
  required: ['device_id', 'command'],
  properties: {
    device_id: { type: 'string', minLength: 1 },
    command: { type: 'string', minLength: 1 },
    parameters: {
      type: 'object',
      additionalProperties: true
    }
  }
};

module.exports = {
  deviceRegistrationSchema,
  dataPointSchema,
  deviceControlSchema
};
