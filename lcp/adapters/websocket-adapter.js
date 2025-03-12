/**
 * WebSocket Adapter
 * Converts between WebSocket protocol and LCP standard format
 */

const WebSocketClient = require('websocket').client;
const DataPoint = require('../models/data-point');

class WebSocketAdapter {
  /**
   * Create a WebSocket adapter
   * @param {Object} options - Adapter options
   * @param {Function} options.onDataCallback - Callback for data events
   * @param {Function} options.onConnectionCallback - Callback for connection events
   */
  constructor(options = {}) {
    this.client = new WebSocketClient();
    this.connections = new Map(); // Map of url -> connection
    this.deviceMap = new Map(); // Map of device_id -> device details
    this.onDataCallback = options.onDataCallback || (() => {});
    this.onConnectionCallback = options.onConnectionCallback || (() => {});

    // Setup websocket client events
    this.client.on('connectFailed', (error) => {
      console.error('WebSocket connection failed:', error.toString());
      this.onConnectionCallback({
        status: 'error',
        protocol: 'WebSocket',
        details: { error: error.toString() }
      });
    });

    this.client.on('connect', (connection) => {
      console.log('WebSocket client connected');
      
      connection.on('error', (error) => {
        console.error('WebSocket connection error:', error.toString());
        this.onConnectionCallback({
          status: 'error',
          protocol: 'WebSocket',
          details: { error: error.toString() }
        });
      });
      
      connection.on('close', () => {
        console.log('WebSocket connection closed');
        this.onConnectionCallback({
          status: 'disconnected',
          protocol: 'WebSocket',
          details: { url: connection.url }
        });
      });
      
      connection.on('message', (message) => {
        if (message.type === 'utf8') {
          try {
            const data = JSON.parse(message.utf8Data);
            const deviceId = this.findDeviceIdByUrl(connection.url);
            
            if (!deviceId) {
              console.warn(`Received WebSocket message from unregistered URL: ${connection.url}`);
              return;
            }
            
            // Convert to LCP DataPoint format
            const dataPoint = new DataPoint({
              deviceId: deviceId,
              protocol: 'WebSocket',
              timestamp: new Date(),
              parameters: data
            });
            
            // Call data callback
            this.onDataCallback(dataPoint);
          } catch (err) {
            console.error('Error processing WebSocket message:', err);
          }
        }
      });
      
      // Store the connection
      this.connections.set(connection.url, connection);
      this.onConnectionCallback({
        status: 'connected',
        protocol: 'WebSocket',
        details: { url: connection.url }
      });
    });
  }

  /**
   * Find device ID by WebSocket URL
   * @param {string} url - WebSocket URL
   * @returns {string|null} Device ID or null if not found
   */
  findDeviceIdByUrl(url) {
    for (const [deviceId, device] of this.deviceMap.entries()) {
      if (device.connection_details.websocket_url === url) {
        return deviceId;
      }
    }
    return null;
  }

  /**
   * Register a device with the WebSocket adapter
   * @param {Object} device - Device details
   * @returns {Promise<void>}
   */
  registerDevice(device) {
    return new Promise((resolve, reject) => {
      try {
        const { device_id, connection_details } = device;
        
        if (!connection_details || !connection_details.websocket_url) {
          return reject(new Error('WebSocket URL not specified for device'));
        }
        
        const { websocket_url } = connection_details;
        
        // Store device info
        this.deviceMap.set(device_id, device);
        
        // Connect to WebSocket server if not already connected
        if (!this.connections.has(websocket_url)) {
          console.log(`Connecting to WebSocket server for device ${device_id}: ${websocket_url}`);
          this.client.connect(websocket_url, device.connection_details.protocol);
        }
        
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Send a command to a WebSocket device
   * @param {Object} command - Command details
   * @returns {Promise<void>}
   */
  sendCommand(command) {
    return new Promise((resolve, reject) => {
      try {
        const { device_id, command: commandName, parameters } = command;
        
        const device = this.deviceMap.get(device_id);
        if (!device) {
          return reject(new Error(`Device not found: ${device_id}`));
        }
        
        const { websocket_url } = device.connection_details;
        if (!websocket_url) {
          return reject(new Error(`WebSocket URL not specified for device: ${device_id}`));
        }
        
        const connection = this.connections.get(websocket_url);
        if (!connection) {
          return reject(new Error(`No active WebSocket connection for device: ${device_id}`));
        }
        
        // Format the command message
        const message = JSON.stringify({
          command: commandName,
          parameters: parameters || {}
        });
        
        connection.sendUTF(message);
        console.log(`Command sent to ${device_id} via WebSocket: ${commandName}`);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   * @param {string} deviceId - Optional device ID to disconnect from
   * @returns {Promise<void>}
   */
  disconnect(deviceId) {
    return new Promise((resolve) => {
      if (deviceId) {
        // Disconnect specific device
        const device = this.deviceMap.get(deviceId);
        if (device && device.connection_details.websocket_url) {
          const connection = this.connections.get(device.connection_details.websocket_url);
          if (connection) {
            connection.close();
            this.connections.delete(device.connection_details.websocket_url);
          }
          this.deviceMap.delete(deviceId);
        }
      } else {
        // Disconnect all
        for (const connection of this.connections.values()) {
          connection.close();
        }
        this.connections.clear();
        this.deviceMap.clear();
      }
      
      resolve();
    });
  }
}

module.exports = WebSocketAdapter;
