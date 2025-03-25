/**
 * Authentication and Authorization Service
 * Handles device authentication and authorization
 */

const { AuthorizationError } = require('../errors/error-handler');

class AuthService {
  /**
   * Create an authentication service
   */
  constructor() {
    // In-memory store of API keys and device permissions
    // In a real implementation, this would be stored in a database
    this.apiKeys = new Map();
    this.devicePermissions = new Map();
  }

  /**
   * Register an API key
   * @param {string} apiKey - API key
   * @param {Object} permissions - Permission settings
   */
  registerApiKey(apiKey, permissions = {}) {
    this.apiKeys.set(apiKey, {
      permissions,
      createdAt: new Date()
    });
  }

  /**
   * Validate an API key
   * @param {string} apiKey - API key to validate
   * @returns {boolean} True if valid
   */
  validateApiKey(apiKey) {
    return this.apiKeys.has(apiKey);
  }

  /**
   * Get API key permissions
   * @param {string} apiKey - API key
   * @returns {Object} Permission settings
   */
  getApiKeyPermissions(apiKey) {
    const keyData = this.apiKeys.get(apiKey);
    if (!keyData) {
      throw new AuthorizationError('Invalid API key');
    }
    return keyData.permissions;
  }

  /**
   * Register device permissions
   * @param {string} deviceId - Device ID
   * @param {Array<string>} allowedApiKeys - List of API keys allowed to access this device
   */
  registerDevicePermissions(deviceId, allowedApiKeys = []) {
    this.devicePermissions.set(deviceId, {
      allowedApiKeys,
      updatedAt: new Date()
    });
  }

  /**
   * Check if an API key has access to a device
   * @param {string} apiKey - API key
   * @param {string} deviceId - Device ID
   * @returns {boolean} True if access is allowed
   */
  canAccessDevice(apiKey, deviceId) {
    // Validate API key first
    if (!this.validateApiKey(apiKey)) {
      return false;
    }
    
    // Check device permissions
    const devicePerms = this.devicePermissions.get(deviceId);
    if (!devicePerms) {
      // Device not registered for permissions
      return false;
    }
    
    return devicePerms.allowedApiKeys.includes(apiKey);
  }

  /**
   * Authorize device access
   * @param {string} apiKey - API key
   * @param {string} deviceId - Device ID
   * @throws {AuthorizationError} If access is not allowed
   */
  authorizeDeviceAccess(apiKey, deviceId) {
    if (!this.canAccessDevice(apiKey, deviceId)) {
      throw new AuthorizationError(`Not authorized to access device: ${deviceId}`);
    }
  }

  /**
   * Create middleware for API key authentication
   * @returns {Function} Express middleware
   */
  apiKeyAuthMiddleware() {
    return (req, res, next) => {
      if (!process.env.API_KEY_ENABLED || process.env.API_KEY_ENABLED === 'false') {
        return next();
      }
      
      const apiKey = req.headers['x-api-key'];
      if (!apiKey) {
        return res.status(401).json({ error: 'API key is required' });
      }
      
      // TODO: Implement actual API key validation
      next();
    };
  }

  /**
   * Create middleware for device authorization
   * @returns {Function} Express middleware
   */
  deviceAuthMiddleware() {
    return (req, res, next) => {
      try {
        const apiKey = req.apiKey;
        const deviceId = req.params.deviceId || req.body.device_id;
        
        if (!deviceId) {
          return next();
        }
        
        this.authorizeDeviceAccess(apiKey, deviceId);
        next();
      } catch (err) {
        next(err);
      }
    };
  }
}

// Create singleton instance
const authService = new AuthService();

// Register some default API keys for testing
authService.registerApiKey('test-api-key', {
  canRegisterDevices: true,
  canControlDevices: true,
  canReadData: true
});

module.exports = authService;
