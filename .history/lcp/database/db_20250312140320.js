const { MongoClient } = require('mongodb');

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.devices = null;
    this.dataPoints = null;
  }
  
  async connect() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lcp';
    this.client = new MongoClient(uri);
    
    await this.client.connect();
    this.db = this.client.db(process.env.DB_NAME || 'lcp');
    
    // 初始化集合
    this.devices = this.db.collection('devices');
    this.dataPoints = this.db.collection('dataPoints');
    
    // 创建索引
    await this.devices.createIndex({ device_id: 1 }, { unique: true });
    await this.dataPoints.createIndex({ device_id: 1, timestamp: -1 });
    
    console.log('Connected to database');
  }
  
  async saveDevice(device) {
    return this.devices.updateOne(
      { device_id: device.device_id },
      { $set: device.toDatabase() },
      { upsert: true }
    );
  }
  
  async saveDataPoint(dataPoint) {
    return this.dataPoints.insertOne(dataPoint.toDatabase());
  }
  
  // 添加其他数据库操作方法...
}

const database = new Database();

module.exports = database;
