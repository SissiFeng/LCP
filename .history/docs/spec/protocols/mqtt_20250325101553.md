# MQTT Protocol Specification for LCP

## Overview

The MQTT protocol adapter enables efficient, publish-subscribe based communication between laboratory devices and the LCP server.

## Topic Structure

### Base Topic Format
```
lcp/{device_id}/{category}/{action}
```

### Standard Topics

#### Device Control
```
lcp/{device_id}/control/command
lcp/{device_id}/control/response
lcp/{device_id}/control/status
```

#### Data
```
lcp/{device_id}/data/measurements
lcp/{device_id}/data/events
lcp/{device_id}/data/logs
```

#### System
```
lcp/{device_id}/system/heartbeat
lcp/{device_id}/system/error
```

## Message Format

### Command Message
```javascript
{
  "id": "cmd-123",
  "timestamp": "2024-03-25T10:00:00Z",
  "command": "START",
  "parameters": {
    // Command specific parameters
  }
}
```

### Response Message
```javascript
{
  "id": "cmd-123",
  "timestamp": "2024-03-25T10:00:01Z",
  "status": "success" | "error",
  "data": {
    // Response data
  }
}
```

### Status Message
```javascript
{
  "timestamp": "2024-03-25T10:00:02Z",
  "state": "IDLE" | "RUNNING" | "ERROR",
  "parameters": {
    // Current device parameters
  }
}
```

### Data Message
```javascript
{
  "timestamp": "2024-03-25T10:00:03Z",
  "type": "measurement" | "event" | "log",
  "data": {
    // Measurement/event/log data
  }
}
```

## Quality of Service (QoS)

### Topic-specific QoS Levels

1. **Control Messages (QoS 2)**
   - Commands
   - Responses
   - Critical status updates

2. **Data Messages (QoS 1)**
   - Measurements
   - Events
   - Non-critical status updates

3. **System Messages (QoS 0)**
   - Heartbeat
   - Debug logs

## Connection Settings

### Broker Configuration
```javascript
{
  "host": "mqtt-broker-host",
  "port": 1883,
  "keepalive": 60,
  "clean_session": true
}
```

### Security Settings
```javascript
{
  "username": "device_username",
  "password": "device_password",
  "ssl": {
    "ca": "path/to/ca.crt",
    "cert": "path/to/client.crt",
    "key": "path/to/client.key"
  }
}
```

## Standard Commands

### Device Control
- START
- STOP
- PAUSE
- RESUME
- RESET

### Data Operations
- GET_DATA
- SET_PARAMETER
- GET_STATUS

### System Operations
- PING
- DISCONNECT

## Error Handling

### Error Categories
1. Connection Errors
2. Authentication Errors
3. Command Errors
4. Device Errors
5. Protocol Errors

### Error Message Format
```javascript
{
  "timestamp": "2024-03-25T10:00:04Z",
  "code": "ERROR_CODE",
  "message": "Error description",
  "details": {
    // Additional error information
  }
}
```

## Connection Management

### Heartbeat
- Device publishes heartbeat every 30 seconds
- Server monitors device presence
- Last Will and Testament (LWT) message configured

### LWT Configuration
```javascript
{
  "topic": "lcp/{device_id}/system/status",
  "payload": {
    "status": "disconnected",
    "timestamp": "ISO8601-timestamp"
  },
  "qos": 1,
  "retain": true
}
```

## Security

### Transport Security
- TLS 1.2 or higher required
- Certificate-based authentication
- Access control lists (ACL)

### Authentication
- Username/password or certificate-based
- Token-based authentication for web clients
- Topic-level access control

## Performance Considerations

### Message Size
- Maximum message size: 256KB
- Recommended size: <50KB
- Use compression for large payloads

### Rate Limiting
- Maximum publish rate: 100 msg/sec
- Burst allowance: 200 messages
- Backpressure handling

## Implementation Guidelines

### Connection Setup
```javascript
const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://broker-host', {
  clientId: 'device-id',
  clean: true,
  keepalive: 60,
  qos: 1
});

client.on('connect', () => {
  // Subscribe to relevant topics
  client.subscribe([
    'lcp/device-id/control/command',
    'lcp/device-id/system/heartbeat'
  ]);
});
```

### Message Publishing
```javascript
client.publish('lcp/device-id/data/measurements', JSON.stringify({
  timestamp: new Date().toISOString(),
  type: 'measurement',
  data: {
    temperature: 25.5,
    humidity: 60
  }
}), { qos: 1 });
```

### Message Handling
```javascript
client.on('message', (topic, message) => {
  const data = JSON.parse(message);
  switch(topic) {
    case 'lcp/device-id/control/command':
      handleCommand(data);
      break;
    case 'lcp/device-id/system/heartbeat':
      handleHeartbeat(data);
      break;
  }
});
```

## Best Practices

1. **Topic Design**
   - Use hierarchical structure
   - Keep topics short
   - Use specific topics for specific purposes

2. **Message Handling**
   - Validate all messages
   - Implement timeout handling
   - Handle backpressure

3. **Security**
   - Use TLS
   - Implement authentication
   - Follow principle of least privilege

4. **Performance**
   - Use appropriate QoS levels
   - Implement message batching
   - Monitor broker health 
