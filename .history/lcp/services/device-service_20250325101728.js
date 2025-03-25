/**
 * Device Service
 * Handles device management and communication
 */

const { DeviceNotFoundError, ValidationError } = require('../errors/error-handler');
const AdapterManager = require('../core/adapter-manager');
const Device = require('../models/device');
const DataPoint = require('../models/data-point');
const { v4: uuidv4 } = require('uuid');
const {
    deviceOperations,
    operationOperations,
    dataOperations,
    errorOperations,
    statusOperations
} = require('../database');
const { validateDeviceManifest } = require('../validators/device-validator');
const { DeviceError } = require('../errors/device-error');
// 未来可能需要引入数据库模块
// const db = require('../database/db');

class DeviceService {
  constructor(adapterManager) {
    this.devices = new Map();
    this.deviceData = new Map();
    
    this.adapterManager = adapterManager;
    
    // 连接适配器
    this.initialize();
  }
  
  async initialize() {
    try {
      await this.adapterManager.connect();
      console.log('Device service initialized');
      
      // 未来可以添加从数据库加载设备
      // await this.loadDevicesFromDatabase();
    } catch (err) {
      console.error('Failed to initialize device service:', err);
    }
  }
  
  // 处理来自设备的数据
  handleDeviceData(dataPoint) {
    // 存储数据点
    this.deviceData.get(dataPoint.deviceId) || [];
    const deviceDataPoints = this.deviceData.get(dataPoint.deviceId);
    deviceDataPoints.push({
      ...dataPoint,
      timestamp: new Date(dataPoint.timestamp)
    });
    
    // Keep only last 1000 data points
    if (deviceDataPoints.length > 1000) {
      deviceDataPoints.shift();
    }
    
    // 更新设备状态
    const device = this.devices.get(dataPoint.deviceId);
    if (device) {
      device.updateStatus('online');
      this.devices.set(dataPoint.deviceId, device);
    }
    
    // 可以添加数据转发到其他系统的逻辑
    console.log(`Received data from ${dataPoint.deviceId}:`, dataPoint.parameters);
    
    // 未来添加数据库持久化
    // this.saveDataPointToDatabase(dataPoint);
  }
  
  async registerDevice(deviceManifest) {
    try {
      // Validate device manifest
      await validateDeviceManifest(deviceManifest);

      // Generate device ID if not provided
      const deviceId = deviceManifest.device_id || uuidv4();

      // Create device record
      const deviceData = {
        device_id: deviceId,
        name: deviceManifest.name,
        type: deviceManifest.type,
        category: deviceManifest.category,
        connection_info: deviceManifest.connection_info,
        capabilities: deviceManifest.capabilities,
        metadata: deviceManifest.metadata
      };

      const device = await deviceOperations.createDevice(deviceData);

      // Initialize device adapter
      await this.adapterManager.initializeAdapter(device);

      return device;
    } catch (error) {
      throw new DeviceError('Device registration failed', error);
    }
  }
  
  async getDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new DeviceNotFoundError(deviceId);
    }
    return device;
  }
  
  async listDevices() {
    return Array.from(this.devices.values());
  }
  
  async updateDeviceStatus(deviceId, status) {
    const device = await this.getDevice(deviceId);
    device.status = status;
    device.lastSeen = new Date();
    this.devices.set(deviceId, device);
    return device;
  }
  
  async processData(dataPoint) {
    const { device_id } = dataPoint;
    
    // Update device last seen
    await this.updateDeviceStatus(device_id, 'online');
    
    // Store data point
    if (!this.deviceData.has(device_id)) {
      this.deviceData.set(device_id, []);
    }
    
    const deviceDataPoints = this.deviceData.get(device_id);
    deviceDataPoints.push({
      ...dataPoint,
      timestamp: new Date(dataPoint.timestamp)
    });
    
    // Keep only last 1000 data points
    if (deviceDataPoints.length > 1000) {
      deviceDataPoints.shift();
    }
    
    return dataPoint;
  }
  
  async getDeviceData(deviceId, limit = 100) {
    await this.getDevice(deviceId); // Verify device exists
    const data = this.deviceData.get(deviceId) || [];
    return data.slice(-limit);
  }
  
  async sendCommand(deviceId, command, params = {}) {
    const device = await this.getDevice(deviceId);
    
    // Log command
    console.log(`Sending command to device ${deviceId}:`, { command, params });
    
    // Update device status
    await this.updateDeviceStatus(deviceId, 'busy');
    
    // In a real implementation, this would send the command through the appropriate protocol adapter
    return {
      status: 'success',
      deviceId,
      command,
      timestamp: new Date()
    };
  }
  
  // 获取设备状态
  getDeviceStatus(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    
    return {
      device_id: device.deviceId,
      status: device.status,
      last_seen: device.lastSeen
    };
  }
  
  // 未来可以添加更多方法，如：
  // - updateDevice(deviceId, updates)
  // - deleteDevice(deviceId)
  // - getDeviceCapabilities(deviceId)
}

// 创建单例实例
const deviceService = new DeviceService();

module.exports = deviceService;
