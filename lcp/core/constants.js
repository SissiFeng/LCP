/**
 * LCP Core Constants
 */

// Device Categories
const DEVICE_CATEGORIES = {
    LIQUID_HANDLING: 'liquid_handling',
    THERMAL_CONTROL: 'thermal_control',
    MEASUREMENT: 'measurement',
    SEPARATION: 'separation',
    IMAGING: 'imaging',
    STORAGE: 'storage',
    ROBOTICS: 'robotics'
};

// Base Commands
const BASE_COMMANDS = {
    START: 'start',
    STOP: 'stop',
    CONFIGURE: 'configure',
    STATUS: 'status',
    RESET: 'reset',
    CALIBRATE: 'calibrate'
};

// Device States
const DEVICE_STATES = {
    IDLE: 'idle',
    RUNNING: 'running',
    ERROR: 'error',
    MAINTENANCE: 'maintenance',
    CALIBRATING: 'calibrating',
    DISCONNECTED: 'disconnected'
};

// Parameter Types
const PARAMETER_TYPES = {
    NUMBER: 'number',
    STRING: 'string',
    BOOLEAN: 'boolean',
    ENUM: 'enum',
    OBJECT: 'object',
    ARRAY: 'array'
};

// Common Units
const COMMON_UNITS = {
    // Temperature
    CELSIUS: 'celsius',
    FAHRENHEIT: 'fahrenheit',
    KELVIN: 'kelvin',
    
    // Volume
    MILLILITER: 'ml',
    MICROLITER: 'ul',
    NANOLITER: 'nl',
    
    // Time
    SECOND: 'second',
    MINUTE: 'minute',
    HOUR: 'hour',
    
    // Distance
    MILLIMETER: 'mm',
    MICROMETER: 'um',
    
    // Speed
    MM_PER_SECOND: 'mm/s',
    RPM: 'rpm',
    
    // Pressure
    PASCAL: 'pa',
    BAR: 'bar',
    PSI: 'psi'
};

// Error Categories
const ERROR_CATEGORIES = {
    COMMUNICATION: 'communication_error',
    HARDWARE: 'hardware_error',
    VALIDATION: 'validation_error',
    PROTOCOL: 'protocol_error',
    SYSTEM: 'system_error'
};

// Communication Protocols
const PROTOCOLS = {
    MQTT: 'mqtt',
    WEBSOCKET: 'websocket',
    REST: 'rest',
    SERIAL: 'serial',
    GPIB: 'gpib',
    MODBUS: 'modbus'
};

// Data Types
const DATA_TYPES = {
    MEASUREMENT: 'measurement',
    STATUS: 'status',
    ERROR: 'error',
    LOG: 'log',
    EVENT: 'event'
};

module.exports = {
    DEVICE_CATEGORIES,
    BASE_COMMANDS,
    DEVICE_STATES,
    PARAMETER_TYPES,
    COMMON_UNITS,
    ERROR_CATEGORIES,
    PROTOCOLS,
    DATA_TYPES
}; 
