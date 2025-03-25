class DeviceError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = 'DeviceError';
        
        // Capture stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DeviceError);
        }

        // Store original error if provided
        if (originalError) {
            this.originalError = originalError;
            this.code = originalError.code || 'DEVICE_ERROR';
            this.details = originalError.details || {};
            
            // Append original error stack if available
            if (originalError.stack) {
                this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
            }
        } else {
            this.code = 'DEVICE_ERROR';
            this.details = {};
        }

        // Add timestamp
        this.timestamp = new Date().toISOString();
    }

    // Convert error to JSON for logging
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            details: this.details,
            timestamp: this.timestamp,
            stack: this.stack,
            originalError: this.originalError ? this.originalError.message : null
        };
    }

    // Static helper methods for common device errors
    static notFound(deviceId) {
        const error = new DeviceError(`Device not found: ${deviceId}`);
        error.code = 'DEVICE_NOT_FOUND';
        return error;
    }

    static connectionFailed(deviceId, details) {
        const error = new DeviceError(`Failed to connect to device: ${deviceId}`);
        error.code = 'DEVICE_CONNECTION_FAILED';
        error.details = details;
        return error;
    }

    static operationFailed(deviceId, operationType, details) {
        const error = new DeviceError(
            `Operation '${operationType}' failed for device: ${deviceId}`
        );
        error.code = 'DEVICE_OPERATION_FAILED';
        error.details = details;
        return error;
    }

    static validationFailed(message, details) {
        const error = new DeviceError(`Validation failed: ${message}`);
        error.code = 'DEVICE_VALIDATION_FAILED';
        error.details = details;
        return error;
    }

    static timeout(deviceId, operation) {
        const error = new DeviceError(
            `Operation timeout for device: ${deviceId}, operation: ${operation}`
        );
        error.code = 'DEVICE_TIMEOUT';
        return error;
    }
}

module.exports = {
    DeviceError
}; 
