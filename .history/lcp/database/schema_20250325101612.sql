-- LCP Database Schema

-- Devices table
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'offline',
    connection_info JSONB,
    capabilities JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Device operations table
CREATE TABLE operations (
    id SERIAL PRIMARY KEY,
    operation_id VARCHAR(50) UNIQUE NOT NULL,
    device_id VARCHAR(50) REFERENCES devices(device_id),
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    parameters JSONB,
    result JSONB,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Device data table
CREATE TABLE device_data (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(device_id),
    operation_id VARCHAR(50) REFERENCES operations(operation_id),
    data_type VARCHAR(50) NOT NULL,
    value JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Device errors table
CREATE TABLE device_errors (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(device_id),
    operation_id VARCHAR(50) REFERENCES operations(operation_id),
    error_code VARCHAR(50) NOT NULL,
    error_message TEXT,
    error_details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Device status history
CREATE TABLE status_history (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(device_id),
    status VARCHAR(20) NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_devices_type ON devices(type);
CREATE INDEX idx_devices_category ON devices(category);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_operations_device_id ON operations(device_id);
CREATE INDEX idx_operations_status ON operations(status);
CREATE INDEX idx_device_data_device_id ON device_data(device_id);
CREATE INDEX idx_device_data_operation_id ON device_data(operation_id);
CREATE INDEX idx_device_errors_device_id ON device_errors(device_id);
CREATE INDEX idx_status_history_device_id ON status_history(device_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for devices table
CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create views
CREATE VIEW device_status_view AS
SELECT 
    d.device_id,
    d.name,
    d.type,
    d.status,
    d.updated_at as last_update,
    (SELECT count(*) FROM operations o 
     WHERE o.device_id = d.device_id AND o.status = 'running') as active_operations,
    (SELECT count(*) FROM device_errors e 
     WHERE e.device_id = d.device_id 
     AND e.timestamp > NOW() - INTERVAL '24 hours') as errors_24h
FROM devices d;

CREATE VIEW device_operations_summary AS
SELECT 
    d.device_id,
    d.name,
    COUNT(o.id) as total_operations,
    SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completed_operations,
    SUM(CASE WHEN o.status = 'failed' THEN 1 ELSE 0 END) as failed_operations,
    AVG(EXTRACT(EPOCH FROM (o.completed_at - o.started_at))) as avg_operation_time
FROM devices d
LEFT JOIN operations o ON d.device_id = o.device_id
GROUP BY d.device_id, d.name; 
