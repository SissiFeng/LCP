const { EventEmitter } = require('events');
const mqtt = require('mqtt');

class DeviceServer extends EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.deviceId = config.deviceId;
        this.mqttClient = null;
        this.connected = false;
    }

    async init() {
        // Initialize MQTT for real-time updates
        if (this.config.mqtt) {
            this.mqttClient = mqtt.connect(this.config.mqtt.broker);
            this.mqttClient.on('connect', () => {
                this.connected = true;
                this.emit('ready');
            });
        }

        // Initialize device connection
        await this.connectDevice();
    }

    async handleRequest(request) {
        const { method, params } = request;
        
        try {
            switch (method) {
                case 'get_status':
                    return await this.getStatus();
                case 'run_experiment':
                    return await this.runExperiment(params);
                case 'stop_experiment':
                    return await this.stopExperiment();
                case 'set_parameter':
                    return await this.setParameter(params);
                case 'get_data':
                    return await this.getData(params);
                case 'calibrate':
                    return await this.calibrate(params);
                default:
                    throw new Error(`Unknown method: ${method}`);
            }
        } catch (error) {
            return {
                error: {
                    code: error.code || -32603,
                    message: error.message
                }
            };
        }
    }

    // Standard device operations - to be implemented by specific device servers
    async connectDevice() {
        throw new Error('connectDevice must be implemented');
    }

    async getStatus() {
        throw new Error('getStatus must be implemented');
    }

    async runExperiment(params) {
        throw new Error('runExperiment must be implemented');
    }

    async stopExperiment() {
        throw new Error('stopExperiment must be implemented');
    }

    async setParameter(params) {
        throw new Error('setParameter must be implemented');
    }

    async getData(params) {
        throw new Error('getData must be implemented');
    }

    async calibrate(params) {
        throw new Error('calibrate must be implemented');
    }

    // Utility methods
    publishUpdate(topic, data) {
        if (this.mqttClient && this.connected) {
            this.mqttClient.publish(`device/${this.deviceId}/${topic}`, JSON.stringify(data));
        }
    }

    async close() {
        if (this.mqttClient) {
            await new Promise(resolve => this.mqttClient.end(false, resolve));
        }
    }
}

// JSON-RPC request handler
async function handleStdin() {
    const server = new DeviceServer({
        deviceId: process.env.DEVICE_ID,
        mqtt: {
            broker: process.env.MQTT_BROKER
        }
    });

    await server.init();

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (data) => {
        try {
            const request = JSON.parse(data);
            const response = await server.handleRequest(request);
            
            console.log(JSON.stringify({
                jsonrpc: '2.0',
                id: request.id,
                result: response
            }));
        } catch (error) {
            console.log(JSON.stringify({
                jsonrpc: '2.0',
                id: null,
                error: {
                    code: -32700,
                    message: 'Parse error'
                }
            }));
        }
    });

    process.on('SIGTERM', async () => {
        await server.close();
        process.exit(0);
    });
}

if (require.main === module) {
    handleStdin().catch(console.error);
}

module.exports = DeviceServer; 
