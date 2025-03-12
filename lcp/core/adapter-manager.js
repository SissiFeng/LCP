/**
 * Adapter Manager
 * Manages protocol adapters and routes data/commands to appropriate adapters
 */

const MqttAdapter = require('../adapters/mqtt-adapter');
const WebSocketAdapter = require('../adapters/websocket-adapter');
const RestAdapter = require('../adapters/rest-adapter');
const DataPoint = require('../models/data-point');

class AdapterManager {
  /**
   * Create an adapter manager
   * @param {Object} options - Manager options
   * @param {Object} options.mqttOptions - MQTT adapter options
   * @param {Object} options.webSocketOptions - WebSocket adapter options
   * @param {Object} options.restOptions - REST adapter options
   * @param {Function} options.onDataCallback - Callback for data events
   * @param {Function} options.onConnectionCallback - Callback for connection events
   */
  constructor(options = {}) {
    this.adapters = new Map();
    this.deviceAdapterMap = new Map(); // Map of device_id -> adapter type
    this.onDataCallback = options.onDataCallback || (() => {});
    this.onConnectionCallback = options.onConnectionCallback || (() => {});
    
    // Initialize adapters
    this.initializeAdapters(options);
  }

  /**
   * Initialize protocol adapters
   * @param {Object} options - Adapter options
   */
  initializeAdapters(options) {
    // MQTT Adapter
    if (options.mqttOptions) {
      const mqttAdapter = new MqttAdapter({
        ...options.mqttOptions,
        onDataCallback: this.handleData.bind(this),
        onConnectionCallback: this.handleConnection.bind(this)
      });
      this.adapters.set('MQTT', mqttAdapter);
    }
    
    // WebSocket Adapter
    if (options.webSocketOptions) {
      const webSocketAdapter = new WebSocketAdapter({
        ...options.webSocketOptions,
        onDataCallback: this.handleData.bind(this),
        onConnectionCallback: this.handleConnection.bind(this)
      });
      this.adapters.set('WebSocket', webSocketAdapter);
    }
    
    // REST Adapter
    if (options.restOptions) {
      const restAdapter = new RestAdapter({
        ...options.restOptions,
        onDataCallback: this.handleData.bind(this),
        onConnectionCallback: this.handleConnection.bind(this)
      });
      this.adapters.set('REST', restAdapter);
    }
  }

  /**
   * Connect all adapters
   * @returns {Promise<void>}
   */
  async connect() {
    const connectPromises = [];
    
    for (const [protocol, adapter] of this.adapters.entries()) {
      if (adapter.connect) {
        console.log(`Connecting ${protocol} adapter...`);
        connectPromises.push(
          adapter.connect()
            .catch(err => {
              console.error(`Failed to connect ${protocol} adapter:`, err);
              return Promise.resolve(); // Don't fail all adapters if one fails
            })
        );
      }
    }
    
    await Promise.all(connectPromises);
    console.log('All adapters connected');
  }

  /**
   * Register a device with the appropriate adapter
   * @param {Object} device - Device details
   * @returns {Promise<void>}
   */
  async registerDevice(device) {
    const { device_id, protocol } = device;
    
    if (!protocol) {
      throw new Error('Protocol not specified for device');
    }
    
    const adapter = this.adapters.get(protocol);
    if (!adapter) {
      throw new Error(`No adapter available for protocol: ${protocol}`);
    }
    
    await adapter.registerDevice(device);
    this.deviceAdapterMap.set(device_id, protocol);
    console.log(`Device ${device_id} registered with ${protocol} adapter`);
  }

  /**
   * Send a command to a device
   * @param {Object} command - Command details
   * @returns {Promise<any>}
   */
  async sendCommand(command) {
    const { device_id } = command;
    
    const protocol = this.deviceAdapterMap.get(device_id);
    if (!protocol) {
      throw new Error(`Device not registered: ${device_id}`);
    }
    
    const adapter = this.adapters.get(protocol);
    if (!adapter) {
      throw new Error(`No adapter available for protocol: ${protocol}`);
    }
    
    return adapter.sendCommand(command);
  }

  /**
   * Fetch data from a device (for non-streaming devices)
   * @param {string} deviceId - Device ID
   * @returns {Promise<DataPoint>}
   */
  async fetchData(deviceId) {
    const protocol = this.deviceAdapterMap.get(deviceId);
    if (!protocol) {
      throw new Error(`Device not registered: ${deviceId}`);
    }
    
    const adapter = this.adapters.get(protocol);
    if (!adapter || !adapter.fetchData) {
      throw new Error(`Fetch not supported for protocol: ${protocol}`);
    }
    
    return adapter.fetchData(deviceId);
  }

  /**
   * Handle data from adapters
   * @param {DataPoint} dataPoint - Data point from device
   */
  handleData(dataPoint) {
    // Forward to callback
    this.onDataCallback(dataPoint);
  }

  /**
   * Handle connection events from adapters
   * @param {Object} event - Connection event
   */
  handleConnection(event) {
    // Forward to callback
    this.onConnectionCallback(event);
  }

  /**
   * Disconnect all adapters
   * @returns {Promise<void>}
   */
  async disconnect() {
    const disconnectPromises = [];
    
    for (const [protocol, adapter] of this.adapters.entries()) {
      if (adapter.disconnect) {
        console.log(`Disconnecting ${protocol} adapter...`);
        disconnectPromises.push(
          adapter.disconnect()
            .catch(err => {
              console.error(`Failed to disconnect ${protocol} adapter:`, err);
              return Promise.resolve(); // Don't fail all adapters if one fails
            })
        );
      }
    }
    
    await Promise.all(disconnectPromises);
    this.deviceAdapterMap.clear();
    console.log('All adapters disconnected');
  }
}

module.exports = AdapterManager;
