const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Create connection pool
const pool = new Pool(config);

// Initialize database
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        // Read and execute schema.sql
        const schema = fs.readFileSync(
            path.join(__dirname, 'schema.sql'),
            'utf8'
        );
        await client.query(schema);
        console.log('Database schema initialized successfully');
    } catch (err) {
        console.error('Error initializing database:', err);
        throw err;
    } finally {
        client.release();
    }
}

// Device operations
const deviceOperations = {
    async createDevice(deviceData) {
        const query = `
            INSERT INTO devices 
            (device_id, name, type, category, connection_info, capabilities, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [
            deviceData.device_id,
            deviceData.name,
            deviceData.type,
            deviceData.category,
            deviceData.connection_info,
            deviceData.capabilities,
            deviceData.metadata
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async updateDevice(deviceId, updateData) {
        const query = `
            UPDATE devices
            SET name = COALESCE($1, name),
                status = COALESCE($2, status),
                connection_info = COALESCE($3, connection_info),
                capabilities = COALESCE($4, capabilities),
                metadata = COALESCE($5, metadata)
            WHERE device_id = $6
            RETURNING *
        `;
        const values = [
            updateData.name,
            updateData.status,
            updateData.connection_info,
            updateData.capabilities,
            updateData.metadata,
            deviceId
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async getDevice(deviceId) {
        const query = 'SELECT * FROM devices WHERE device_id = $1';
        const result = await pool.query(query, [deviceId]);
        return result.rows[0];
    },

    async listDevices(filters = {}) {
        let query = 'SELECT * FROM devices WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (filters.type) {
            query += ` AND type = $${paramCount}`;
            values.push(filters.type);
            paramCount++;
        }

        if (filters.category) {
            query += ` AND category = $${paramCount}`;
            values.push(filters.category);
            paramCount++;
        }

        if (filters.status) {
            query += ` AND status = $${paramCount}`;
            values.push(filters.status);
            paramCount++;
        }

        const result = await pool.query(query, values);
        return result.rows;
    }
};

// Operation management
const operationOperations = {
    async createOperation(operationData) {
        const query = `
            INSERT INTO operations 
            (operation_id, device_id, type, status, parameters, started_at)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            RETURNING *
        `;
        const values = [
            operationData.operation_id,
            operationData.device_id,
            operationData.type,
            operationData.status,
            operationData.parameters
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async updateOperation(operationId, updateData) {
        const query = `
            UPDATE operations
            SET status = COALESCE($1, status),
                result = COALESCE($2, result),
                completed_at = CASE 
                    WHEN $1 IN ('completed', 'failed') 
                    THEN CURRENT_TIMESTAMP 
                    ELSE completed_at 
                END
            WHERE operation_id = $3
            RETURNING *
        `;
        const values = [
            updateData.status,
            updateData.result,
            operationId
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async getOperation(operationId) {
        const query = 'SELECT * FROM operations WHERE operation_id = $1';
        const result = await pool.query(query, [operationId]);
        return result.rows[0];
    },

    async listDeviceOperations(deviceId, status = null) {
        let query = 'SELECT * FROM operations WHERE device_id = $1';
        const values = [deviceId];

        if (status) {
            query += ' AND status = $2';
            values.push(status);
        }

        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, values);
        return result.rows;
    }
};

// Data management
const dataOperations = {
    async saveData(dataRecord) {
        const query = `
            INSERT INTO device_data 
            (device_id, operation_id, data_type, value)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const values = [
            dataRecord.device_id,
            dataRecord.operation_id,
            dataRecord.data_type,
            dataRecord.value
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async getDeviceData(deviceId, options = {}) {
        let query = 'SELECT * FROM device_data WHERE device_id = $1';
        const values = [deviceId];
        let paramCount = 2;

        if (options.data_type) {
            query += ` AND data_type = $${paramCount}`;
            values.push(options.data_type);
            paramCount++;
        }

        if (options.start_time) {
            query += ` AND timestamp >= $${paramCount}`;
            values.push(options.start_time);
            paramCount++;
        }

        if (options.end_time) {
            query += ` AND timestamp <= $${paramCount}`;
            values.push(options.end_time);
            paramCount++;
        }

        query += ' ORDER BY timestamp DESC';

        if (options.limit) {
            query += ` LIMIT $${paramCount}`;
            values.push(options.limit);
        }

        const result = await pool.query(query, values);
        return result.rows;
    }
};

// Error logging
const errorOperations = {
    async logError(errorData) {
        const query = `
            INSERT INTO device_errors 
            (device_id, operation_id, error_code, error_message, error_details)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [
            errorData.device_id,
            errorData.operation_id,
            errorData.error_code,
            errorData.error_message,
            errorData.error_details
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async getDeviceErrors(deviceId, options = {}) {
        let query = 'SELECT * FROM device_errors WHERE device_id = $1';
        const values = [deviceId];
        let paramCount = 2;

        if (options.start_time) {
            query += ` AND timestamp >= $${paramCount}`;
            values.push(options.start_time);
            paramCount++;
        }

        if (options.end_time) {
            query += ` AND timestamp <= $${paramCount}`;
            values.push(options.end_time);
            paramCount++;
        }

        query += ' ORDER BY timestamp DESC';

        if (options.limit) {
            query += ` LIMIT $${paramCount}`;
            values.push(options.limit);
        }

        const result = await pool.query(query, values);
        return result.rows;
    }
};

// Status history
const statusOperations = {
    async recordStatus(statusData) {
        const query = `
            INSERT INTO status_history 
            (device_id, status, metadata)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        const values = [
            statusData.device_id,
            statusData.status,
            statusData.metadata
        ];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async getStatusHistory(deviceId, options = {}) {
        let query = 'SELECT * FROM status_history WHERE device_id = $1';
        const values = [deviceId];
        let paramCount = 2;

        if (options.start_time) {
            query += ` AND timestamp >= $${paramCount}`;
            values.push(options.start_time);
            paramCount++;
        }

        if (options.end_time) {
            query += ` AND timestamp <= $${paramCount}`;
            values.push(options.end_time);
            paramCount++;
        }

        query += ' ORDER BY timestamp DESC';

        if (options.limit) {
            query += ` LIMIT $${paramCount}`;
            values.push(options.limit);
        }

        const result = await pool.query(query, values);
        return result.rows;
    }
};

// Export database operations
module.exports = {
    pool,
    initializeDatabase,
    deviceOperations,
    operationOperations,
    dataOperations,
    errorOperations,
    statusOperations
}; 
