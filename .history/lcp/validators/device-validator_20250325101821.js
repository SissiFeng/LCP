const Joi = require('joi');
const { DeviceError } = require('../errors/device-error');

// Define validation schemas
const connectionInfoSchema = Joi.object({
    protocol: Joi.string().valid('mqtt', 'websocket', 'rest').required(),
    host: Joi.string().required(),
    port: Joi.number().port().required(),
    path: Joi.string(),
    auth: Joi.object({
        username: Joi.string(),
        password: Joi.string(),
        token: Joi.string()
    }).optional(),
    ssl: Joi.boolean().default(false),
    options: Joi.object().optional()
}).required();

const capabilitiesSchema = Joi.object({
    operations: Joi.array().items(Joi.string()).required(),
    features: Joi.array().items(Joi.string()).required(),
    data_types: Joi.array().items(Joi.string()).required(),
    parameters: Joi.object().pattern(
        Joi.string(),
        Joi.object({
            type: Joi.string().required(),
            unit: Joi.string(),
            range: Joi.object({
                min: Joi.number(),
                max: Joi.number()
            }).optional(),
            enum: Joi.array().items(Joi.any()).optional(),
            default: Joi.any().optional()
        })
    ).required()
}).required();

const deviceManifestSchema = Joi.object({
    device_id: Joi.string().optional(),
    name: Joi.string().required(),
    type: Joi.string().required(),
    category: Joi.string().required(),
    manufacturer: Joi.string().required(),
    model: Joi.string().required(),
    firmware_version: Joi.string().required(),
    connection_info: connectionInfoSchema,
    capabilities: capabilitiesSchema,
    metadata: Joi.object().optional()
}).required();

// Validation functions
async function validateDeviceManifest(manifest) {
    try {
        const validationResult = await deviceManifestSchema.validateAsync(manifest, {
            abortEarly: false,
            allowUnknown: false
        });
        return validationResult;
    } catch (error) {
        throw DeviceError.validationFailed('Invalid device manifest', {
            errors: error.details.map(detail => ({
                path: detail.path,
                message: detail.message
            }))
        });
    }
}

async function validateConnectionInfo(connectionInfo) {
    try {
        const validationResult = await connectionInfoSchema.validateAsync(connectionInfo, {
            abortEarly: false,
            allowUnknown: false
        });
        return validationResult;
    } catch (error) {
        throw DeviceError.validationFailed('Invalid connection info', {
            errors: error.details.map(detail => ({
                path: detail.path,
                message: detail.message
            }))
        });
    }
}

async function validateCapabilities(capabilities) {
    try {
        const validationResult = await capabilitiesSchema.validateAsync(capabilities, {
            abortEarly: false,
            allowUnknown: false
        });
        return validationResult;
    } catch (error) {
        throw DeviceError.validationFailed('Invalid capabilities', {
            errors: error.details.map(detail => ({
                path: detail.path,
                message: detail.message
            }))
        });
    }
}

// Parameter validation
async function validateParameter(paramName, value, parameterSpec) {
    try {
        // Create dynamic schema based on parameter specification
        let schema = Joi.any();
        
        switch (parameterSpec.type) {
            case 'number':
                schema = Joi.number();
                if (parameterSpec.range) {
                    schema = schema.min(parameterSpec.range.min).max(parameterSpec.range.max);
                }
                break;
            case 'string':
                schema = Joi.string();
                if (parameterSpec.enum) {
                    schema = schema.valid(...parameterSpec.enum);
                }
                break;
            case 'boolean':
                schema = Joi.boolean();
                break;
            case 'array':
                schema = Joi.array();
                break;
            case 'object':
                schema = Joi.object();
                break;
            default:
                throw new Error(`Unsupported parameter type: ${parameterSpec.type}`);
        }

        if (parameterSpec.required !== false) {
            schema = schema.required();
        }

        const validationResult = await schema.validateAsync(value);
        return validationResult;
    } catch (error) {
        throw DeviceError.validationFailed(`Invalid parameter: ${paramName}`, {
            parameter: paramName,
            value: value,
            specification: parameterSpec,
            error: error.message
        });
    }
}

// Operation validation
async function validateOperation(operation, deviceCapabilities) {
    if (!deviceCapabilities.operations.includes(operation)) {
        throw DeviceError.validationFailed('Unsupported operation', {
            operation,
            supported: deviceCapabilities.operations
        });
    }
    return true;
}

// Export validation functions
module.exports = {
    validateDeviceManifest,
    validateConnectionInfo,
    validateCapabilities,
    validateParameter,
    validateOperation
}; 
