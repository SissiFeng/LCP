/**
 * Device Model
 * Defines the data structure for laboratory devices
 */

class Device {
  /**
   * Create a device
   * @param {Object} options - Device options
   * @param {string} options.device_id - Unique identifier for the device
   * @param {string} options.device_type - Type of the device
   * @param {string} options.category - Category of the device
   * @param {Array} options.capabilities - Capabilities of the device
   * @param {Object} options.parameters - Parameters of the device
   * @param {string} options.protocol - Communication protocol (MQTT, WebSocket, REST)
   * @param {Object} options.connection_details - Protocol-specific connection details
   * @param {Object} options.metadata - Device metadata and capabilities
   * @param {string} options.status - Device status (online, offline, error)
   * @param {string} options.last_seen - Last seen timestamp
   */
  constructor({
    device_id,
    device_type,
    category,
    capabilities,
    parameters,
    protocol,
    connection_details,
    metadata
  }) {
    this.device_id = device_id;
    this.device_type = device_type;
    this.category = category;
    this.capabilities = capabilities || [];
    this.parameters = parameters || {};
    this.protocol = protocol;
    this.connection_details = connection_details;
    this.metadata = metadata || {};
    this.status = 'disconnected';
    this.last_seen = null;
  }

  /**
   * Convert Device to database format
   * @returns {Object} Database representation of the device
   */
  toDatabase() {
    return {
      device_id: this.device_id,
      device_type: this.device_type,
      category: this.category,
      capabilities: this.capabilities,
      parameters: this.parameters,
      protocol: this.protocol,
      connection_details: this.connection_details,
      metadata: this.metadata,
      status: this.status,
      last_seen: this.last_seen
    };
  }

  /**
   * Create Device from database format
   * @param {Object} dbObject - Database representation of the device
   * @returns {Device} Device instance
   */
  static fromDatabase(dbObject) {
    return new Device({
      device_id: dbObject.device_id,
      device_type: dbObject.device_type,
      category: dbObject.category,
      capabilities: dbObject.capabilities,
      parameters: dbObject.parameters,
      protocol: dbObject.protocol,
      connection_details: dbObject.connection_details,
      metadata: dbObject.metadata,
      status: dbObject.status,
      last_seen: dbObject.last_seen
    });
  }

  /**
   * Update device status
   * @param {string} status - New status
   */
  updateStatus(status) {
    this.status = status;
    this.last_seen = new Date().toISOString();
  }

  /**
   * Update device metadata
   * @param {Object} metadata - New metadata
   */
  updateMetadata(metadata) {
    this.metadata = { ...this.metadata, ...metadata };
  }

  /**
   * Check if the device has a specific capability
   * @param {string} capability - Capability to check
   * @returns {boolean} True if the device has the capability, false otherwise
   */
  hasCapability(capability) {
    return this.capabilities.includes(capability);
  }

  /**
   * Validate a device parameter
   * @param {string} name - Name of the parameter
   * @param {any} value - Value of the parameter
   * @returns {boolean} True if the parameter is valid, false otherwise
   */
  validateParameter(name, value) {
    const param = this.parameters[name];
    if (!param) {
      throw new Error(`Unknown parameter: ${name}`);
    }

    if (param.type === 'number') {
      if (typeof value !== 'number') {
        throw new Error(`Parameter ${name} must be a number`);
      }
      if (param.range) {
        const [min, max] = param.range;
        if (value < min || value > max) {
          throw new Error(`Parameter ${name} must be between ${min} and ${max}`);
        }
      }
    }

    return true;
  }

  /**
   * Get device descriptor
   * @returns {Object} Device descriptor
   */
  getDescriptor() {
    return {
      device_id: this.device_id,
      device_type: this.device_type,
      category: this.category,
      capabilities: this.capabilities,
      parameters: this.parameters,
      status: this.status,
      last_seen: this.last_seen,
      metadata: this.metadata
    };
  }

  /**
   * Get device connection information
   * @returns {Object} Device connection information
   */
  getConnectionInfo() {
    return {
      protocol: this.protocol,
      ...this.connection_details
    };
  }

  /**
   * Check if the device supports a specific command
   * @param {string} command - Command to check
   * @returns {boolean} True if the device supports the command, false otherwise
   */
  supportsCommand(command) {
    const BASE_COMMANDS = [
      'start',
      'stop',
      'configure',
      'status',
      'reset',
      'calibrate'
    ];
    
    return BASE_COMMANDS.includes(command) || 
           this.capabilities.includes(`command:${command}`);
  }

  /**
   * Get device validation schema
   * @param {string} device_type - Type of the device
   * @returns {Object} Device validation schema
   */
  static getValidationSchema(device_type) {
    const schemas = {
      thermal_cycler: {
        required_capabilities: [
          'temperature_control',
          'program_execution'
        ],
        required_parameters: ['temperature', 'duration']
      },
      liquid_handler: {
        required_capabilities: [
          'liquid_transfer',
          'position_control'
        ],
        required_parameters: ['volume', 'position']
      }
      // 可以添加更多设备类型的验证规则
    };

    return schemas[device_type] || {
      required_capabilities: [],
      required_parameters: []
    };
  }
}

module.exports = Device;
