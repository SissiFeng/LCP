/**
 * DataPoint Model
 * Defines the data structure for device measurements and readings
 */

class DataPoint {
  /**
   * Create a data point
   * @param {Object} options - Data point options
   * @param {string} options.deviceId - ID of the device that generated this data
   * @param {string} options.protocol - Protocol used to receive this data (MQTT, WebSocket, REST)
   * @param {Date} options.timestamp - Time when the data was collected
   * @param {Object} options.parameters - Key-value pairs of measured parameters
   * @param {string} options.experimentId - Optional ID of the associated experiment
   */
  constructor(options) {
    this.deviceId = options.deviceId;
    this.protocol = options.protocol;
    this.timestamp = options.timestamp || new Date();
    this.parameters = options.parameters || {};
    this.experimentId = options.experimentId || null;
    this.createdAt = options.createdAt || new Date();
  }

  /**
   * Convert DataPoint to database format
   * @returns {Object} Database representation of the data point
   */
  toDatabase() {
    return {
      device_id: this.deviceId,
      protocol: this.protocol,
      timestamp: this.timestamp,
      parameters: this.parameters,
      experiment_id: this.experimentId,
      created_at: this.createdAt
    };
  }

  /**
   * Create DataPoint from database format
   * @param {Object} dbObject - Database representation of the data point
   * @returns {DataPoint} DataPoint instance
   */
  static fromDatabase(dbObject) {
    return new DataPoint({
      deviceId: dbObject.device_id,
      protocol: dbObject.protocol,
      timestamp: dbObject.timestamp,
      parameters: dbObject.parameters,
      experimentId: dbObject.experiment_id,
      createdAt: dbObject.created_at
    });
  }

  /**
   * Add or update a parameter
   * @param {string} key - Parameter name
   * @param {any} value - Parameter value
   */
  addParameter(key, value) {
    this.parameters[key] = value;
  }

  /**
   * Get parameter value
   * @param {string} key - Parameter name
   * @returns {any} Parameter value
   */
  getParameter(key) {
    return this.parameters[key];
  }

  /**
   * Create a standardized representation for client consumption
   * @returns {Object} Standardized data format
   */
  toStandardFormat() {
    return {
      device_id: this.deviceId,
      timestamp: this.timestamp.toISOString(),
      protocol: this.protocol,
      parameters: this.parameters,
      experiment_id: this.experimentId
    };
  }
}

module.exports = DataPoint;
