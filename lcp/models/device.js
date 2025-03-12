/**
 * Device Model
 * Defines the data structure for laboratory devices
 */

class Device {
  /**
   * Create a device
   * @param {Object} options - Device options
   * @param {string} options.deviceId - Unique identifier for the device
   * @param {string} options.protocol - Communication protocol (MQTT, WebSocket, REST)
   * @param {Object} options.connectionDetails - Protocol-specific connection details
   * @param {Object} options.metadata - Device metadata and capabilities
   * @param {string} options.status - Device status (online, offline, error)
   */
  constructor(options) {
    this.deviceId = options.deviceId;
    this.protocol = options.protocol;
    this.connectionDetails = options.connectionDetails || {};
    this.metadata = options.metadata || {};
    this.status = options.status || 'offline';
    this.lastSeen = options.lastSeen || new Date();
    this.createdAt = options.createdAt || new Date();
    this.updatedAt = options.updatedAt || new Date();
  }

  /**
   * Convert Device to database format
   * @returns {Object} Database representation of the device
   */
  toDatabase() {
    return {
      device_id: this.deviceId,
      protocol: this.protocol,
      connection_details: this.connectionDetails,
      metadata: this.metadata,
      status: this.status,
      last_seen: this.lastSeen,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  /**
   * Create Device from database format
   * @param {Object} dbObject - Database representation of the device
   * @returns {Device} Device instance
   */
  static fromDatabase(dbObject) {
    return new Device({
      deviceId: dbObject.device_id,
      protocol: dbObject.protocol,
      connectionDetails: dbObject.connection_details,
      metadata: dbObject.metadata,
      status: dbObject.status,
      lastSeen: dbObject.last_seen,
      createdAt: dbObject.created_at,
      updatedAt: dbObject.updated_at
    });
  }

  /**
   * Update device status
   * @param {string} status - New status
   */
  updateStatus(status) {
    this.status = status;
    this.lastSeen = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Update device metadata
   * @param {Object} metadata - New metadata
   */
  updateMetadata(metadata) {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }
}

module.exports = Device;
