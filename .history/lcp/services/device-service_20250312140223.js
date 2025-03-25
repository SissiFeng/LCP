/**
 * Device Service
 * Manages devices, data, and commands
 */

const AdapterManager = require('../core/adapter-manager');
const Device = require('../models/device');
const DataPoint = require('../models/data-point');
// 未来可能需要引入数据库模块
// const db = require('../database/db');

class DeviceService {
  constructor() {
    this.devices = new Map(); // 设备内存存储
    this.dataPoints = []; // 数据点内存存储
    
    // 初始化适配器管理器
    this.adapterManager = new AdapterManager({
      mqttOptions: {
        brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
        onDataCallback: this.handleDeviceData.bind(this)
      },
      webSocketOptions: {
        onDataCallback: this.handleDeviceData.bind(this)
      },
      restOptions: {
        onDataCallback: this.handleDeviceData.bind(this)
      }
    });
    
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
    this.dataPoints.push(dataPoint);
    
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
  
  // 注册新设备
  async registerDevice(deviceData) {
    try {
      // 创建设备模型
      const device = new Device({
        deviceId: deviceData.device_id,
        protocol: deviceData.protocol,
        connectionDetails: deviceData.connection_details,
        metadata: deviceData.metadata,
        status: 'registered'
      });
      
      // 存储设备信息
      this.devices.set(device.deviceId, device);
      
      // 向适配器注册设备
      await this.adapterManager.registerDevice({
        device_id: device.deviceId,
        protocol: device.protocol,
        connection_details: device.connectionDetails
      });
      
      // 未来添加数据库持久化
      // await this.saveDeviceToDatabase(device);
      
      return device;
    } catch (err) {
      console.error(`Failed to register device:`, err);
      throw err;
    }
  }
  
  // 发送命令到设备
  async sendCommand(commandData) {
    try {
      const { device_id, command, parameters } = commandData;
      
      // 检查设备是否存在
      if (!this.devices.has(device_id)) {
        throw new Error(`Device not found: ${device_id}`);
      }
      
      // 通过适配器发送命令
      const result = await this.adapterManager.sendCommand({
        device_id,
        command,
        parameters
      });
      
      return result;
    } catch (err) {
      console.error(`Failed to send command:`, err);
      throw err;
    }
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
  
  // 获取设备数据
  getDeviceData(deviceId, limit = 10) {
    // 筛选指定设备的数据点，按时间倒序排列
    const data = this.dataPoints
      .filter(dp => dp.deviceId === deviceId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    return data.map(dp => dp.toStandardFormat());
  }
  
  // 获取所有设备列表
  listDevices() {
    return Array.from(this.devices.values()).map(device => ({
      device_id: device.deviceId,
      protocol: device.protocol,
      status: device.status,
      last_seen: device.lastSeen,
      metadata: device.metadata
    }));
  }
  
  // 未来可以添加更多方法，如：
  // - updateDevice(deviceId, updates)
  // - deleteDevice(deviceId)
  // - getDeviceCapabilities(deviceId)
}

// 创建单例实例
const deviceService = new DeviceService();

module.exports = deviceService;
