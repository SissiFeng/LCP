const DeviceServer = require('../template/server');
const mqtt = require('mqtt');

class OT2Server extends DeviceServer {
    constructor(config) {
        super(config);
        this.experimentRunning = false;
        this.currentProtocol = null;
    }

    async connectDevice() {
        // OT2 specific MQTT topics
        const topics = [
            `ot2/${this.deviceId}/status`,
            `ot2/${this.deviceId}/response`,
            `ot2/${this.deviceId}/error`
        ];

        if (this.mqttClient) {
            this.mqttClient.subscribe(topics);
            this.mqttClient.on('message', (topic, message) => {
                this.handleMqttMessage(topic, message);
            });
        }
    }

    async getStatus() {
        return {
            device_id: this.deviceId,
            status: this.experimentRunning ? 'running' : 'idle',
            current_protocol: this.currentProtocol,
            connected: this.connected
        };
    }

    async runExperiment(params) {
        const { protocol_file, labware_config, pipette_config } = params;
        
        if (this.experimentRunning) {
            throw new Error('Experiment already running');
        }

        // Convert LCP format to OT2 specific format
        const ot2Command = {
            type: 'run_protocol',
            protocol: protocol_file,
            labware: labware_config,
            pipettes: pipette_config
        };

        // Publish command to OT2
        this.publishUpdate('command', ot2Command);
        this.experimentRunning = true;
        this.currentProtocol = protocol_file;

        return {
            status: 'started',
            protocol: protocol_file
        };
    }

    async stopExperiment() {
        if (!this.experimentRunning) {
            throw new Error('No experiment running');
        }

        this.publishUpdate('command', {
            type: 'stop_protocol'
        });

        this.experimentRunning = false;
        this.currentProtocol = null;

        return {
            status: 'stopped'
        };
    }

    async setParameter(params) {
        // OT2 specific parameter setting
        const { parameter, value } = params;
        
        this.publishUpdate('command', {
            type: 'set_parameter',
            parameter,
            value
        });

        return {
            parameter,
            value,
            status: 'parameter_set'
        };
    }

    async getData(params) {
        // Get run logs or sensor data from OT2
        const { data_type, start_time, end_time } = params;
        
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({
                    data_type,
                    data: [],
                    status: 'timeout'
                });
            }, 5000);

            this.once('data_received', (data) => {
                clearTimeout(timeout);
                resolve(data);
            });

            this.publishUpdate('command', {
                type: 'get_data',
                data_type,
                start_time,
                end_time
            });
        });
    }

    async calibrate(params) {
        const { calibration_type } = params;
        
        this.publishUpdate('command', {
            type: 'calibrate',
            calibration_type
        });

        return {
            status: 'calibration_started',
            type: calibration_type
        };
    }

    handleMqttMessage(topic, message) {
        try {
            const data = JSON.parse(message.toString());
            
            if (topic.endsWith('/status')) {
                this.experimentRunning = data.status === 'running';
                this.emit('status_update', data);
            } else if (topic.endsWith('/response')) {
                this.emit('data_received', data);
            } else if (topic.endsWith('/error')) {
                this.emit('error', new Error(data.message));
            }

            // Forward to Canvas through MQTT
            this.publishUpdate('data', {
                timestamp: new Date().toISOString(),
                topic: topic.split('/').pop(),
                data
            });
        } catch (error) {
            console.error('Error handling MQTT message:', error);
        }
    }
}

// Start server if running directly
if (require.main === module) {
    const server = new OT2Server({
        deviceId: process.env.DEVICE_ID || 'ot2_default',
        mqtt: {
            broker: process.env.MQTT_BROKER || 'mqtt://localhost'
        }
    });

    handleStdin().catch(console.error);
}

module.exports = OT2Server; 
