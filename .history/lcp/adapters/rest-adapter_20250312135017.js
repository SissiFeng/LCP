/**
 * REST Adapter
 * Converts between REST API protocol and LCP standard format
 */

const axios = require('axios');
const DataPoint = require('../models/data-point');

class RestAdapter {
  /**
   * Create a REST adapter
   * @param {Object} options - Adapter options
   * @param {Function} options.onDataCallback - Callback for data events
   * @param {Function} options.onConnectionCallback - Callback for connection events
   */
  constructor(options = {}) {
    this.deviceMap = new Map(); // Map of device_id -> device details
    this.pollingIntervals = new Map(); // Map of device_id -> polling interval
    this.onDataCallback = options.onDataCallback || (() => {});
    this.onConnectionCallback = options.onConnectionCallback || (() => {});
  }

  /**
   * Register a device with the REST adapter
   * @param {Object} device - Device details
   * @returns {Promise<void>}
   */
  registerDevice(device) {
    return new Promise((resolve, reject) => {
      try {
        const { device_id, connection_details } = device;
        
        if (!connection_details || !connection_details.base_url) {
          return reject(new Error('REST base URL not specified for device'));
        }
        
        // Store device info
        this.deviceMap.set(device_id, device);
        
        // Test connection
        this.testConnection(device)
          .then(() => {
            // Start polling if polling_interval is specified
            if (connection_details.polling_interval) {
              this.startPolling(device_id, connection_details.polling_interval);
            }
            resolve();
          })
          .catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Test connection to a REST device
   * @param {Object} device - Device details
   * @returns {Promise<void>}
   */
  testConnection(device) {
    return new Promise((resolve, reject) => {
      const { device_id, connection_details } = device;
      const { base_url, health_endpoint = '/health', auth_token } = connection_details;
      
      const headers = {};
      if (auth_token) {
        headers['Authorization'] = `Bearer ${auth_token}`;
      }
      
      axios.get(`${base_url}${health_endpoint}`, { headers })
        .then(response => {
          console.log(`REST connection successful for device ${device_id}`);
          this.onConnectionCallback({
            status: 'connected',
            protocol: 'REST',
            details: { url: base_url }
          });
          resolve();
        })
        .catch(error => {
          console.error(`REST connection failed for device ${device_id}:`, error.message);
          this.onConnectionCallback({
            status: 'error',
            protocol: 'REST',
            details: { error: error.message }
          });
          reject(error);
        });
    });
  }

  /**
   * Start polling a REST device for data
   * @param {string} deviceId - Device ID
   * @param {number} interval - Polling interval in milliseconds
   */
  startPolling(deviceId, interval) {
    // Clear existing interval if any
    this.stopPolling(deviceId);
    
    const device = this.deviceMap.get(deviceId);
    if (!device) {
      console.warn(`Cannot start polling for unknown device: ${deviceId}`);
      return;
    }
    
    const { connection_details } = device;
    const { base_url, data_endpoint = '/data', auth_token } = connection_details;
    
    const headers = {};
    if (auth_token) {
      headers['Authorization'] = `Bearer ${auth_token}`;
    }
    
    // Start new polling interval
    const intervalId = setInterval(() => {
      axios.get(`${base_url}${data_endpoint}`, { headers })
        .then(response => {
          // Convert to LCP DataPoint format
          const dataPoint = new DataPoint({
            deviceId: deviceId,
            protocol: 'REST',
            timestamp: new Date(),
            parameters: response.data
          });
          
          // Call data callback
          this.onDataCallback(dataPoint);
        })
        .catch(error => {
          console.error(`Error polling REST device ${deviceId}:`, error.message);
        });
    }, interval);
    
    this.pollingIntervals.set(deviceId, intervalId);
    console.log(`Started polling for device ${deviceId} every ${interval}ms`);
  }

  /**
   * Stop polling a REST device
   * @param {string} deviceId - Device ID
   */
  stopPolling(deviceId) {
    const intervalId = this.pollingIntervals.get(deviceId);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(deviceId);
      console.log(`Stopped polling for device ${deviceId}`);
    }
  }

  /**
   * Send a command to a REST device
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
        
        const { connection_details } = device;
        const { base_url, control_endpoint = '/control', auth_token } = connection_details;
        
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (auth_token) {
          headers['Authorization'] = `Bearer ${auth_token}`;
        }
        
        // Format the command message
        const data = {
          command: commandName,
          parameters: parameters || {}
        };
        
        axios.post(`${base_url}${control_endpoint}`, data, { headers })
          .then(response => {
            console.log(`Command sent to ${device_id} via REST: ${commandName}`);
            resolve(response.data);
          })
          .catch(error => {
            console.error(`Failed to send command to ${device_id}:`, error.message);
            reject(error);
          });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Fetch data from a REST device
   * @param {string} deviceId - Device ID
   * @returns {Promise<DataPoint>}
   */
  fetchData(deviceId) {
    return new Promise((resolve, reject) => {
      const device = this.deviceMap.get(deviceId);
      if (!device) {
        return reject(new Error(`Device not found: ${deviceId}`));
      }
      
      const { connection_details } = device;
      const { base_url, data_endpoint = '/data', auth_token } = connection_details;
      
      const headers = {};
      if (auth_token) {
        headers['Authorization'] = `Bearer ${auth_token}`;
      }
      
      axios.get(`${base_url}${data_endpoint}`, { headers })
        .then(response => {
          // Convert to LCP DataPoint format
          const dataPoint = new DataPoint({
            deviceId: deviceId,
            protocol: 'REST',
            timestamp: new Date(),
            parameters: response.data
          });
          
          resolve(dataPoint);
        })
        .catch(error => {
          console.error(`Error fetching data from REST device ${deviceId}:`, error.message);
          reject(error);
        });
    });
  }

  /**
   * Disconnect a REST device (stop polling)
   * @param {string} deviceId - Optional device ID to disconnect
   */
  disconnect(deviceId) {
    if (deviceId) {
      // Disconnect specific device
      this.stopPolling(deviceId);
      this.deviceMap.delete(deviceId);
    } else {
      // Disconnect all
      for (const id of this.pollingIntervals.keys()) {
        this.stopPolling(id);
      }
      this.deviceMap.clear();
    }
  }
}

module.exports = RestAdapter;
