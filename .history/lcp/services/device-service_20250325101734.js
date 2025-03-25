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
  
  async getDeviceData(deviceId, options = {}) {
    try {
      return await dataOperations.getDeviceData(deviceId, options);
    } catch (error) {
      throw new DeviceError('Data retrieval failed', error);
    }
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
  
  async updateDevice(deviceId, updateData) {
    try {
      const device = await deviceOperations.updateDevice(deviceId, updateData);
      if (!device) {
        throw new DeviceError('Device not found');
      }

      // Update adapter if connection info changed
      if (updateData.connection_info) {
        await this.adapterManager.updateAdapter(device);
      }

      return device;
    } catch (error) {
      throw new DeviceError('Device update failed', error);
    }
  }
  
  async removeDevice(deviceId) {
    try {
      const device = await deviceOperations.getDevice(deviceId);
      if (!device) {
        throw new DeviceError('Device not found');
      }

      // Disconnect device
      await this.adapterManager.removeAdapter(deviceId);

      // Device will be archived rather than deleted
      await deviceOperations.updateDevice(deviceId, { status: 'archived' });

      return { success: true, message: 'Device archived successfully' };
    } catch (error) {
      throw new DeviceError('Device removal failed', error);
    }
  }
  
  async startOperation(deviceId, operationType, parameters) {
    try {
      const device = await deviceOperations.getDevice(deviceId);
      if (!device) {
        throw new DeviceError('Device not found');
      }

      // Generate operation ID
      const operationId = uuidv4();

      // Create operation record
      const operation = await operationOperations.createOperation({
        operation_id: operationId,
        device_id: deviceId,
        type: operationType,
        status: 'pending',
        parameters
      });

      // Execute operation through adapter
      const adapter = this.adapterManager.getAdapter(deviceId);
      const result = await adapter.executeOperation(operationType, parameters);

      // Update operation status
      await operationOperations.updateOperation(operationId, {
        status: 'running',
        result: result
      });

      return operation;
    } catch (error) {
      throw new DeviceError('Operation start failed', error);
    }
  }
  
  async stopOperation(deviceId, operationId) {
    try {
      const operation = await operationOperations.getOperation(operationId);
      if (!operation || operation.device_id !== deviceId) {
        throw new DeviceError('Operation not found');
      }

      // Stop operation through adapter
      const adapter = this.adapterManager.getAdapter(deviceId);
      await adapter.stopOperation(operationId);

      // Update operation status
      await operationOperations.updateOperation(operationId, {
        status: 'stopped'
      });

      return { success: true, message: 'Operation stopped successfully' };
    } catch (error) {
      throw new DeviceError('Operation stop failed', error);
    }
  }
  
  async saveDeviceData(deviceId, operationId, dataType, value) {
    try {
      const dataRecord = {
        device_id: deviceId,
        operation_id: operationId,
        data_type: dataType,
        value
      };

      return await dataOperations.saveData(dataRecord);
    } catch (error) {
      throw new DeviceError('Data save failed', error);
    }
  }
  
  async updateDeviceStatus(deviceId, status, metadata = {}) {
    try {
      // Update device status
      await deviceOperations.updateDevice(deviceId, { status });

      // Record status change
      await statusOperations.recordStatus({
        device_id: deviceId,
        status,
        metadata
      });

      return { success: true, message: 'Status updated successfully' };
    } catch (error) {
      throw new DeviceError('Status update failed', error);
    }
  }
  
  async getDeviceStatus(deviceId) {
    try {
      const device = await deviceOperations.getDevice(deviceId);
      if (!device) {
        throw new DeviceError('Device not found');
      }

      const activeOperations = await operationOperations.listDeviceOperations(
        deviceId,
        'running'
      );

      return {
        current_status: device.status,
        active_operations: activeOperations,
        last_updated: device.updated_at
      };
    } catch (error) {
      throw new DeviceError('Status retrieval failed', error);
    }
  }
  
  async logDeviceError(deviceId, operationId, error) {
    try {
      const errorData = {
        device_id: deviceId,
        operation_id: operationId,
        error_code: error.code || 'UNKNOWN_ERROR',
        error_message: error.message,
        error_details: error.details || {}
      };

      // Log error
      await errorOperations.logError(errorData);

      // Update device status
      await this.updateDeviceStatus(deviceId, 'error', {
        error_code: error.code,
        error_message: error.message
      });

      // If operation exists, update its status
      if (operationId) {
        await operationOperations.updateOperation(operationId, {
          status: 'failed',
          result: { error: errorData }
        });
      }

      return { success: true, message: 'Error logged successfully' };
    } catch (error) {
      throw new DeviceError('Error logging failed', error);
    }
  }
  
  async getDeviceErrors(deviceId, options = {}) {
    try {
      return await errorOperations.getDeviceErrors(deviceId, options);
    } catch (error) {
      throw new DeviceError('Error retrieval failed', error);
    }
  }
  
  async validateDeviceConnection(deviceId) {
    try {
      const adapter = this.adapterManager.getAdapter(deviceId);
      const isConnected = await adapter.testConnection();

      if (!isConnected) {
        throw new DeviceError('Device connection test failed');
      }

      return { success: true, message: 'Device connection validated' };
    } catch (error) {
      throw new DeviceError('Connection validation failed', error);
    }
  }
  
  async getDeviceCapabilities(deviceId) {
    try {
      const device = await deviceOperations.getDevice(deviceId);
      if (!device) {
        throw new DeviceError('Device not found');
      }

      return {
        capabilities: device.capabilities,
        supported_operations: device.capabilities.operations || [],
        features: device.capabilities.features || []
      };
    } catch (error) {
      throw new DeviceError('Capabilities retrieval failed', error);
    }
  }
}

// 创建单例实例
const deviceService = new DeviceService();

module.exports = deviceService;
