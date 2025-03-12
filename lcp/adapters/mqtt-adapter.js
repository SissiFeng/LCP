/**
 * MQTT Adapter
 * Converts between MQTT protocol and LCP standard format
 */

const mqtt = require('mqtt');
const DataPoint = require('../models/data-point');

class MqttAdapter {
  /**
   * Create an MQTT adapter
   * @param {Object} options - Adapter options
   * @param {string} options.brokerUrl - MQTT broker URL (e.g. mqtt://broker.example.com)
   * @param {Object} options.options - MQTT connection options
   * @param {Function} options.onDataCallback - Callback for data events
   * @param {Function} options.onConnectionCallback - Callback for connection events
   */
  constructor(options = {}) {
    this.brokerUrl = options.brokerUrl;
    this.options = options.options || {};
    this.client = null;
    this.subscriptions = new Map(); // Map of topic -> device_id
    this.deviceMap = new Map(); // Map of device_id -> device details
    this.onDataCallback = options.onDataCallback || (() => {});
    this.onConnectionCallback = options.onConnectionCallback || (() => {});
  }

  /**
   * Connect to MQTT broker
   * @returns {Promise<void>}
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.client = mqtt.connect(this.brokerUrl, this.options);

        this.client.on('connect', () => {
          console.log('MQTT adapter connected to broker:', this.brokerUrl);
          this.onConnectionCallback({
            status: 'connected',
            protocol: 'MQTT',
            details: { broker: this.brokerUrl }
          });
          resolve();
        });

        this.client.on('error', (error) => {
          console.error('MQTT adapter error:', error);
          this.onConnectionCallback({
            status: 'error',
            protocol: 'MQTT',
            details: { error: error.message }
          });
          reject(error);
        });

        this.client.on('message', (topic, message) => {
          try {
            const deviceId = this.subscriptions.get(topic);
            if (!deviceId) {
              console.warn(`Received MQTT message on unregistered topic: ${topic}`);
              return;
            }

            const device = this.deviceMap.get(deviceId);
            if (!device) {
              console.warn(`Received MQTT message for unknown device: ${deviceId}`);
              return;
            }

            const messageStr = message.toString();
            const messageObj = JSON.parse(messageStr);

            // Convert to LCP DataPoint format
            const dataPoint = new DataPoint({
              deviceId: deviceId,
              protocol: 'MQTT',
              timestamp: new Date(),
              parameters: messageObj
            });

            // Call data callback
            this.onDataCallback(dataPoint);
          } catch (err) {
            console.error('Error processing MQTT message:', err, 'on topic:', topic);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Register a device with the MQTT adapter
   * @param {Object} device - Device details
   * @returns {Promise<void>}
   */
  registerDevice(device) {
    return new Promise((resolve, reject) => {
      try {
        const { device_id, connection_details } = device;
        
        if (!connection_details || !connection_details.mqtt_topics) {
          return reject(new Error('MQTT topics not specified for device'));
        }
        
        const { data: dataTopic, control: controlTopic } = connection_details.mqtt_topics;
        
        if (dataTopic) {
          this.client.subscribe(dataTopic, (err) => {
            if (err) {
              console.error(`Failed to subscribe to ${dataTopic}:`, err);
              return reject(err);
            }
            
            this.subscriptions.set(dataTopic, device_id);
            console.log(`Subscribed to ${dataTopic} for device ${device_id}`);
          });
        }
        
        this.deviceMap.set(device_id, device);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Send a command to an MQTT device
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
        
        const { control: controlTopic } = device.connection_details.mqtt_topics;
        if (!controlTopic) {
          return reject(new Error(`Control topic not specified for device: ${device_id}`));
        }
        
        // Format the command message
        const message = JSON.stringify({
          command: commandName,
          parameters: parameters || {}
        });
        
        this.client.publish(controlTopic, message, (err) => {
          if (err) {
            console.error(`Failed to publish command to ${controlTopic}:`, err);
            return reject(err);
          }
          
          console.log(`Command sent to ${device_id} on ${controlTopic}: ${commandName}`);
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Disconnect from MQTT broker
   * @returns {Promise<void>}
   */
  disconnect() {
    return new Promise((resolve) => {
      if (!this.client) {
        return resolve();
      }
      
      this.client.end(true, () => {
        console.log('MQTT adapter disconnected from broker');
        this.onConnectionCallback({
          status: 'disconnected',
          protocol: 'MQTT',
          details: { broker: this.brokerUrl }
        });
        this.client = null;
        this.subscriptions.clear();
        resolve();
      });
    });
  }
}

module.exports = MqttAdapter;
