# LCP Migration Guide

This guide helps you migrate from the current LCP implementation to the new distributed architecture.

## Key Changes

1. **Server Architecture**
   - FROM: Single server managing multiple devices
   - TO: Individual servers for each device/UO operation

2. **Communication Protocol**
   - FROM: Direct HTTP/MQTT/WebSocket
   - TO: JSON-RPC over stdin/stdout + MQTT for events

3. **Device Management**
   - FROM: Centralized device registry
   - TO: Distributed device servers with discovery

## Migration Steps

### 1. Server Migration

#### For Each Device Type:

1. Create a new server directory:
```bash
mkdir -p lcp/servers/your_device_type
```

2. Copy the template server:
```bash
cp lcp/servers/template/server.js lcp/servers/your_device_type/
```

3. Implement device-specific operations:
```javascript
class YourDeviceServer extends DeviceServer {
    async connectDevice() {
        // Implement device connection
    }

    async getStatus() {
        // Implement status check
    }

    // ... implement other required methods
}
```

### 2. Protocol Migration

1. Update your Canvas integration to use JSON-RPC:

```javascript
// Old way
const response = await axios.post('/api/lcp/control', {
    device_id: 'device1',
    command: 'start'
});

// New way
const response = await sendJsonRpc({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
        name: 'run_experiment',
        arguments: {
            device: 'device1'
        }
    }
});
```

2. Update event handling:

```javascript
// Old way
mqtt.subscribe('device/+/data');

// New way
mqtt.subscribe('device/${deviceId}/+');
```

### 3. Data Model Migration

1. Update your device configurations:

```javascript
// Old format
{
    "device_id": "device1",
    "protocol": "mqtt",
    "connection": {
        "broker": "mqtt://localhost"
    }
}

// New format
{
    "device_id": "device1",
    "server_type": "oscilloscope",
    "connection": {
        "type": "gpib",
        "address": "GPIB0::1::INSTR"
    }
}
```

2. Update your data formats:

```javascript
// Old format
{
    "device_id": "device1",
    "timestamp": "2024-03-12T12:00:00Z",
    "data": {
        "temperature": 25.5
    }
}

// New format
{
    "jsonrpc": "2.0",
    "method": "data_update",
    "params": {
        "device": "device1",
        "timestamp": "2024-03-12T12:00:00Z",
        "values": {
            "temperature": 25.5
        }
    }
}
```

## Testing Migration

1. Start by migrating one device type
2. Run both old and new systems in parallel
3. Validate data consistency
4. Gradually migrate other devices

## Rollback Plan

Keep the old system running until:
1. All devices are migrated
2. New system is stable
3. No data inconsistencies for 1 week

## Timeline

1. Week 1-2: Setup new architecture
2. Week 3-4: Migrate first device type
3. Week 5-8: Migrate remaining devices
4. Week 9-10: Testing and validation
5. Week 11-12: Monitoring and cleanup

## Support

For migration support:
1. Check the example implementations
2. Review the troubleshooting guide
3. Contact the LCP team for assistance 
