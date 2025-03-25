/**
 * Device Descriptor Template
 * This template defines the standard structure for describing laboratory devices in LCP.
 * Each device should provide a descriptor following this format for registration.
 */

const { 
    DEVICE_CATEGORIES, 
    BASE_COMMANDS, 
    PARAMETER_TYPES, 
    COMMON_UNITS, 
    PROTOCOLS 
} = require('../core/constants');

/**
 * Example Device Descriptor
 * Demonstrates how to describe a laboratory device for LCP integration
 */
const deviceDescriptorTemplate = {
    // Basic Device Information
    device_info: {
        device_id: "unique_device_identifier",  // Unique identifier for the device
        name: "Device Name",                    // Human readable device name
        manufacturer: "Manufacturer Name",       // Device manufacturer
        model: "Model Number",                  // Device model number
        serial_number: "Serial Number",         // Device serial number
        firmware_version: "1.0.0",              // Current firmware version
        category: DEVICE_CATEGORIES.LIQUID_HANDLING  // Device category from predefined list
    },

    // Device Capabilities
    capabilities: {
        // List of supported base commands
        commands: [
            {
                name: BASE_COMMANDS.START,
                description: "Start device operation",
                parameters: []  // No parameters needed for basic start
            },
            {
                name: BASE_COMMANDS.STOP,
                description: "Stop device operation",
                parameters: []  // No parameters needed for basic stop
            },
            {
                name: "custom_command",  // Example of device-specific command
                description: "Custom operation specific to this device",
                parameters: [
                    {
                        name: "parameter1",
                        type: PARAMETER_TYPES.NUMBER,
                        unit: COMMON_UNITS.MILLILITER,
                        range: [0, 100],
                        required: true,
                        description: "Volume to dispense"
                    }
                ]
            }
        ],

        // Device-specific features
        features: [
            {
                name: "feature_name",
                description: "Description of device feature",
                parameters: [
                    {
                        name: "parameter_name",
                        type: PARAMETER_TYPES.NUMBER,
                        unit: COMMON_UNITS.CELSIUS,
                        range: [4, 95],
                        default: 25,
                        description: "Parameter description"
                    }
                ]
            }
        ]
    },

    // Communication Configuration
    communication: {
        protocol: PROTOCOLS.MQTT,  // Primary communication protocol
        settings: {
            // Protocol-specific settings
            broker: "mqtt://example.broker.com",
            port: 1883,
            topics: {
                status: "device/status",
                command: "device/command",
                data: "device/data"
            },
            qos: 1
        },
        data_format: {
            // Define expected data formats for different message types
            status: {
                type: "object",
                properties: {
                    state: "string",
                    timestamp: "string",
                    parameters: "object"
                }
            },
            command: {
                type: "object",
                properties: {
                    command: "string",
                    parameters: "object"
                }
            }
        }
    },

    // Device Parameters
    parameters: {
        // Operational parameters
        operational: {
            parameter1: {
                type: PARAMETER_TYPES.NUMBER,
                unit: COMMON_UNITS.MILLILITER,
                range: [0, 100],
                default: 50,
                description: "Operational parameter description"
            }
        },
        // Configuration parameters
        configuration: {
            setting1: {
                type: PARAMETER_TYPES.ENUM,
                options: ["option1", "option2", "option3"],
                default: "option1",
                description: "Configuration parameter description"
            }
        }
    },

    // Calibration Information
    calibration: {
        required: true,
        interval: "P30D",  // ISO 8601 duration format
        parameters: [
            {
                name: "cal_param1",
                type: PARAMETER_TYPES.NUMBER,
                unit: COMMON_UNITS.MILLILITER,
                description: "Calibration parameter description"
            }
        ]
    },

    // Maintenance Information
    maintenance: {
        schedule: [
            {
                task: "Regular Cleaning",
                interval: "P7D",  // Every 7 days
                description: "Regular cleaning procedure"
            }
        ]
    }
};

// Validation function for device descriptors
function validateDeviceDescriptor(descriptor) {
    // Basic validation logic
    const required_fields = [
        'device_info.device_id',
        'device_info.category',
        'capabilities.commands',
        'communication.protocol',
        'communication.settings'
    ];

    // Check required fields
    for (const field of required_fields) {
        const value = field.split('.').reduce((obj, key) => obj && obj[key], descriptor);
        if (!value) {
            throw new Error(`Missing required field: ${field}`);
        }
    }

    // Additional validation can be added here
    return true;
}

module.exports = {
    deviceDescriptorTemplate,
    validateDeviceDescriptor
}; 
