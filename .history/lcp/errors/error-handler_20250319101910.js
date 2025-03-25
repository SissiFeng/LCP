/**
 * Error Handler
 * Defines standard error types and handling for LCP
 */

/**
 * Base LCP Error class
 */
class LcpError extends Error {
  /**
   * Create a new LCP error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {number} status - HTTP status code
   */
  constructor(message, code, status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error
 */
class ValidationError extends LcpError {
  /**
   * Create a validation error
   * @param {string} message - Error message
   * @param {Array} details - Validation error details
   */
  constructor(message, details = []) {
    super(message, 'VALIDATION_ERROR', 400);
    this.details = details;
  }
}

/**
 * Device Not Found Error
 */
class DeviceNotFoundError extends LcpError {
  /**
   * Create a device not found error
   * @param {string} deviceId - Device ID
   */
  constructor(deviceId) {
    super(`Device not found: ${deviceId}`, 'DEVICE_NOT_FOUND', 404);
    this.deviceId = deviceId;
  }
}

/**
 * Protocol Not Supported Error
 */
class ProtocolNotSupportedError extends LcpError {
  /**
   * Create a protocol not supported error
   * @param {string} protocol - Protocol name
   */
  constructor(protocol) {
    super(`Protocol not supported: ${protocol}`, 'PROTOCOL_NOT_SUPPORTED', 400);
    this.protocol = protocol;
  }
}

/**
 * Connection Error
 */
class ConnectionError extends LcpError {
  /**
   * Create a connection error
   * @param {string} message - Error message
   * @param {string} protocol - Protocol name
   * @param {Object} details - Connection error details
   */
  constructor(message, protocol, details = {}) {
    super(message, 'CONNECTION_ERROR', 500);
    this.protocol = protocol;
    this.details = details;
  }
}

/**
 * Command Error
 */
class CommandError extends LcpError {
  /**
   * Create a command error
   * @param {string} message - Error message
   * @param {string} deviceId - Device ID
   * @param {string} command - Command name
   */
  constructor(message, deviceId, command) {
    super(message, 'COMMAND_ERROR', 500);
    this.deviceId = deviceId;
    this.command = command;
  }
}

/**
 * Authorization Error
 */
class AuthorizationError extends LcpError {
  /**
   * Create an authorization error
   * @param {string} message - Error message
   */
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

/**
 * Error handler middleware for Express
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandlerMiddleware = (err, req, res, next) => {
  console.error(err);

  // Default error
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.details;
  }

  res.status(statusCode).json({
    error: {
      message,
      details,
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = {
  LcpError,
  ValidationError,
  DeviceNotFoundError,
  ProtocolNotSupportedError,
  ConnectionError,
  CommandError,
  AuthorizationError,
  errorHandlerMiddleware
};
