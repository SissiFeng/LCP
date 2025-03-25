# Canvas Integration with LCP

This document describes how Canvas can integrate with the Laboratory Context Protocol (LCP) to communicate with laboratory devices. LCP acts as a standardized communication layer that abstracts away the complexity of different device protocols, allowing Canvas to interact with all laboratory equipment through a single, consistent REST API.

## Table of Contents

1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Data Formats](#data-formats)
4. [Integration Examples](#integration-examples)
5. [Error Handling](#error-handling)
6. [Advanced Usage](#advanced-usage)

## Overview

The Laboratory Context Protocol (LCP) serves as a middleware between Canvas and various laboratory devices. LCP handles:

- Protocol adaptation (MQTT, WebSocket, REST)
- Device connection management
- Data standardization
- Command routing

Canvas only needs to interact with LCP's REST API endpoints to:
- Discover available devices
- Receive standardized device data
- Send commands to devices
- Monitor device status

![LCP-Canvas Integration Architecture](https://via.placeholder.com/800x400?text=LCP-Canvas+Integration+Architecture)

## API Endpoints

All LCP endpoints are available under the base URL: `http://{lcp-server-host}:{port}/api/lcp`

### Device Discovery

#### List all devices

```http
GET /api/lcp/devices
```

Response:
```json
{
  "devices": [
    {
      "device_id": "bambu_001",
      "protocol": "MQTT",
      "status": "online",
      "last_seen": "2024-05-01T15:30:22Z",
      "metadata": {
        "name": "Bambu Lab X1",
        "manufacturer": "Bambu Lab",
        "capabilities": ["temperature_control", "printing"]
      }
    },
    {
      "device_id": "hplc_001",
      "protocol": "REST",
      "status": "online",
      "last_seen": "2024-05-01T15:29:45Z",
      "metadata": {
        "name": "HPLC System",
        "manufacturer": "Agilent",
        "capabilities": ["sample_analysis", "flow_control"]
      }
    }
  ]
}
```

#### Get device details

```http
GET /api/lcp/devices/{device_id}/status
```

Response:
```json
{
  "device_id": "bambu_001",
  "status": "online",
  "last_seen": "2024-05-01T15:30:22Z",
  "protocol": "MQTT",
  "metadata": {
    "name": "Bambu Lab X1",
    "manufacturer": "Bambu Lab",
    "model": "X1 Carbon",
    "serial_number": "BL123456",
    "capabilities": ["temperature_control", "printing", "monitoring"]
  },
  "connection_details": {
    "mqtt_topics": {
      "data": "lab/devices/bambu_001/data",
      "control": "lab/devices/bambu_001/control"
    }
  }
}
```

### Data Retrieval

#### Get device data

```http
GET /api/lcp/devices/{device_id}/data
```

Response:
```json
[
  {
    "device_id": "bambu_001",
    "timestamp": "2024-05-01T15:30:22Z",
    "protocol": "MQTT",
    "parameters": {
      "temperature": 35.5,
      "pressure": 1.2,
      "status": "printing"
    },
    "experiment_id": "exp_12345"
  },
  {
    "device_id": "bambu_001",
    "timestamp": "2024-05-01T15:30:12Z",
    "protocol": "MQTT",
    "parameters": {
      "temperature": 35.3,
      "pressure": 1.2,
      "status": "printing"
    },
    "experiment_id": "exp_12345"
  }
]
```

#### Submit data to LCP

Canvas can also submit data to LCP if needed:

```http
POST /api/lcp/data
Content-Type: application/json
```

Request:
```json
{
  "device_id": "custom_device_001",
  "timestamp": "2024-05-01T15:35:00Z",
  "protocol": "REST",
  "parameters": {
    "temperature": 25.5,
    "pressure": 1.0,
    "ph": 7.2
  },
  "experiment_id": "exp_12345"
}
```

Response:
```json
{
  "message": "Data received successfully",
  "device_id": "custom_device_001",
  "timestamp": "2024-05-01T15:35:00Z"
}
```

### Device Control

#### Send command to device

```http
POST /api/lcp/control
Content-Type: application/json
```

Request:
```json
{
  "device_id": "bambu_001",
  "command": "set_temperature",
  "parameters": {
    "temperature": 40.0
  }
}
```

Response:
```json
{
  "message": "Command sent successfully",
  "device_id": "bambu_001",
  "command": "set_temperature"
}
```

### Device Registration

If Canvas needs to register new devices with LCP:

```http
POST /api/lcp/register
Content-Type: application/json
```

Request:
```json
{
  "device_id": "microscope_001",
  "protocol": "WebSocket",
  "connection_details": {
    "websocket_url": "ws://192.168.1.121:9000/stream",
    "protocol": "v1.microscope"
  },
  "metadata": {
    "name": "Digital Microscope",
    "manufacturer": "Leica",
    "model": "DM6 B",
    "capabilities": ["live_imaging", "magnification_control"]
  }
}
```

Response:
```json
{
  "message": "Device registered successfully",
  "device_id": "microscope_001"
}
```

## Data Formats

### Standard Device Data Format

All device data, regardless of the original protocol, is standardized to this format:

```json
{
  "device_id": "string",          // Unique device identifier
  "timestamp": "ISO8601 string",  // When the data was collected
  "protocol": "string",           // Original protocol (MQTT, WebSocket, REST)
  "parameters": {                 // Device-specific data
    "property1": value,
    "property2": value,
    ...
  },
  "experiment_id": "string"       // Optional experiment identifier
}
```

### Standard Command Format

Commands to any device follow this format:

```json
{
  "device_id": "string",          // Target device identifier
  "command": "string",            // Command name
  "parameters": {                 // Command parameters
    "property1": value,
    "property2": value,
    ...
  }
}
```

## Integration Examples

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LCP_BASE_URL = 'http://localhost:3000/api/lcp';

function DeviceComponent({ deviceId }) {
  const [deviceData, setDeviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch device data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${LCP_BASE_URL}/devices/${deviceId}/data`);
        setDeviceData(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
    // Set up polling or WebSocket connection for real-time updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [deviceId]);

  // Send command to device
  const sendCommand = async (command, parameters) => {
    try {
      const response = await axios.post(`${LCP_BASE_URL}/control`, {
        device_id: deviceId,
        command,
        parameters
      });
      console.log('Command sent:', response.data);
      // Handle success
    } catch (err) {
      console.error('Error sending command:', err);
      // Handle error
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="device-card">
      <h2>Device: {deviceId}</h2>
      {deviceData && deviceData.length > 0 && (
        <div className="device-data">
          <h3>Latest Data:</h3>
          <p>Timestamp: {deviceData[0].timestamp}</p>
          <p>Status: {deviceData[0].parameters.status || 'N/A'}</p>
          <p>Temperature: {deviceData[0].parameters.temperature || 'N/A'}</p>
          {/* Render other parameters as needed */}
        </div>
      )}
      <div className="device-controls">
        <button onClick={() => sendCommand('start', {})}>Start</button>
        <button onClick={() => sendCommand('stop', {})}>Stop</button>
        <button onClick={() => sendCommand('set_temperature', { temperature: 40.0 })}>
          Set Temperature to 40°C
        </button>
      </div>
    </div>
  );
}

export default DeviceComponent;
```

### Canvas Node Integration Example

For implementing a device node in Canvas:

```jsx
import React from 'react';
import { Handle } from 'react-flow-renderer';
import axios from 'axios';

const LCP_BASE_URL = 'http://localhost:3000/api/lcp';

class DeviceNode extends React.Component {
  state = {
    deviceStatus: 'unknown',
    deviceData: null,
    loading: true
  };

  componentDidMount() {
    this.fetchDeviceStatus();
    this.dataInterval = setInterval(this.fetchDeviceData, 5000);
  }

  componentWillUnmount() {
    clearInterval(this.dataInterval);
  }

  fetchDeviceStatus = async () => {
    try {
      const { data } = await axios.get(`${LCP_BASE_URL}/devices/${this.props.data.deviceId}/status`);
      this.setState({ deviceStatus: data.status });
    } catch (err) {
      console.error('Error fetching device status:', err);
    }
  };

  fetchDeviceData = async () => {
    try {
      const { data } = await axios.get(`${LCP_BASE_URL}/devices/${this.props.data.deviceId}/data`);
      if (data && data.length > 0) {
        this.setState({ deviceData: data[0], loading: false });
        
        // Forward data to connected nodes if any
        if (this.props.data.onDataUpdate) {
          this.props.data.onDataUpdate(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching device data:', err);
      this.setState({ loading: false });
    }
  };

  sendDeviceCommand = async (command, parameters) => {
    try {
      await axios.post(`${LCP_BASE_URL}/control`, {
        device_id: this.props.data.deviceId,
        command,
        parameters
      });
      // Handle success
    } catch (err) {
      console.error('Error sending command:', err);
      // Handle error
    }
  };

  render() {
    const { deviceStatus, deviceData, loading } = this.state;
    const { deviceId, name } = this.props.data;

    return (
      <div className={`device-node status-${deviceStatus}`}>
        <Handle type="target" position="top" />
        
        <div className="node-header">
          <span className="device-type">{name}</span>
          <span className="device-status">{deviceStatus}</span>
        </div>
        
        <div className="node-content">
          {loading ? (
            <p>Loading data...</p>
          ) : deviceData ? (
            <div className="parameters">
              {Object.entries(deviceData.parameters).map(([key, value]) => (
                <div className="parameter" key={key}>
                  <span className="param-name">{key}:</span>
                  <span className="param-value">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>No data available</p>
          )}
        </div>
        
        <div className="node-actions">
          <button onClick={() => this.sendDeviceCommand('start', {})}>Start</button>
          <button onClick={() => this.sendDeviceCommand('stop', {})}>Stop</button>
        </div>
        
        <Handle type="source" position="bottom" />
      </div>
    );
  }
}

export default DeviceNode;
```

## Error Handling

LCP uses standard HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request format or parameters
- `401 Unauthorized`: Missing or invalid API key
- `404 Not Found`: Device or resource not found
- `500 Internal Server Error`: Server-side error

Error responses will follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

Common error codes:

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request does not meet the schema requirements |
| `DEVICE_NOT_FOUND` | The specified device does not exist |
| `PROTOCOL_NOT_SUPPORTED` | The device uses an unsupported protocol |
| `CONNECTION_ERROR` | Cannot connect to the device |
| `COMMAND_ERROR` | Error executing the command |
| `UNAUTHORIZED` | Authentication failure |

## Advanced Usage

### Experiment Integration

You can associate device data with specific experiments:

```http
POST /api/lcp/data
Content-Type: application/json
```

```json
{
  "device_id": "bambu_001",
  "timestamp": "2024-05-01T15:35:00Z",
  "protocol": "MQTT",
  "parameters": {
    "temperature": 35.5,
    "pressure": 1.2
  },
  "experiment_id": "exp_12345"
}
```

Then filter data by experiment:

```http
GET /api/lcp/devices/{device_id}/data?experiment_id=exp_12345
```

### Real-time Data with Server-Sent Events

For real-time updates, you can use Server-Sent Events (SSE):

```javascript
const eventSource = new EventSource(`${LCP_BASE_URL}/devices/${deviceId}/events`);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
  // Update UI with new data
};

eventSource.onerror = (error) => {
  console.error('EventSource error:', error);
  eventSource.close();
};
```

### Batch Command Execution

To send commands to multiple devices:

```http
POST /api/lcp/batch-control
Content-Type: application/json
```

```json
{
  "commands": [
    {
      "device_id": "bambu_001",
      "command": "set_temperature",
      "parameters": {
        "temperature": 40.0
      }
    },
    {
      "device_id": "hplc_001",
      "command": "start_flow",
      "parameters": {
        "flow_rate": 1.5
      }
    }
  ]
}
```

---

## Need Help?

If you encounter any issues integrating Canvas with LCP, please:

1. Check that the LCP server is running and accessible
2. Verify your API endpoint URLs are correct
3. Ensure device IDs match between Canvas and LCP
4. Check the LCP server logs for detailed error information

For further assistance, please contact the LCP development team. 
