module.exports = {
    // OT2 MQTT topics configuration
    mqtt: {
        topics: {
            status: 'ot2/{device_id}/status',
            response: 'ot2/{device_id}/response',
            error: 'ot2/{device_id}/error',
            command: 'ot2/{device_id}/command'
        }
    },

    // OT2 specific command types
    commands: {
        RUN_PROTOCOL: 'run_protocol',
        STOP_PROTOCOL: 'stop_protocol',
        SET_PARAMETER: 'set_parameter',
        GET_DATA: 'get_data',
        CALIBRATE: 'calibrate'
    },

    // Default timeouts
    timeouts: {
        connection: 5000,
        command: 10000,
        data: 5000
    },

    // Protocol validation schema
    protocolSchema: {
        required: ['protocol_file', 'labware_config', 'pipette_config'],
        properties: {
            protocol_file: { type: 'string' },
            labware_config: {
                type: 'object',
                properties: {
                    labware: { type: 'array' },
                    positions: { type: 'object' }
                }
            },
            pipette_config: {
                type: 'object',
                properties: {
                    left: { type: 'object' },
                    right: { type: 'object' }
                }
            }
        }
    },

    // Status mappings
    statusMappings: {
        'running': 'running',
        'idle': 'idle',
        'error': 'error',
        'calibrating': 'busy',
        'paused': 'paused'
    }
}; 
