# LCP Device Integration Guide

This guide provides step-by-step instructions for integrating new laboratory devices with the Laboratory Context Protocol (LCP) system. The LCP serves as a universal adapter layer that standardizes communication between various laboratory instruments and data processing systems.

## Table of Contents

1. [Understanding Your Device](#understanding-your-device)
2. [Device Registration Process](#device-registration-process)
3. [Protocol-Specific Integration](#protocol-specific-integration)
4. [Testing the Integration](#testing-the-integration)
5. [Troubleshooting](#troubleshooting)
6. [Advanced Configuration](#advanced-configuration)

## Understanding Your Device

Before integrating a new device, gather the following information:

### 1. Communication Protocol

Identify which protocol your device uses:
- **MQTT**: Common for IoT devices like sensors or 3D printers (e.g., Bambu Lab)
- **WebSocket**: Used for real-time data streaming devices (e.g., microscope video feeds)
- **REST API**: Used for devices with HTTP-based interfaces (e.g., HPLC, LC-MS)
- **Serial/USB**: These may require a protocol adapter

### 2. Device Capabilities

Document the device's:
- Available commands
- Data output format
- Parameters that can be set
- Monitoring values that can be read

### 3. Authentication Requirements

Determine if the device requires:
- API keys
- Username/password
- Certificates
- Other authentication methods

## Device Registration Process

### Step 1: Create Device Registration Payload

Create a JSON file with your device's specifications. Below are examples for different protocol types:

**MQTT Device (e.g., Bambu Lab Printer)**
```json
{
  "device_id": "bambu_lab_x1_001",
  "protocol": "MQTT",
  "connection_details": {
    "mqtt_topics": {
      "data": "lab/devices/bambu_001/data",
      "control": "lab/devices/bambu_001/control"
    }
  },
  "metadata": {
    "name": "Bambu Lab X1",
    "manufacturer": "Bambu Lab",
    "model": "X1 Carbon",
    "serial_number": "BL123456",
    "capabilities": ["temperature_control", "printing", "monitoring"]
  }
}
```
OR


**REST API Device (e.g., HPLC)**
```json
{
  "device_id": "hplc_agilent_001",
  "protocol": "REST",
  "connection_details": {
    "base_url": "http://192.168.1.120:8080/api",
    "health_endpoint": "/status",
    "data_endpoint": "/measurements",
    "control_endpoint": "/commands",
    "polling_interval": 5000,
    "auth_token": "your_device_auth_token"
  },
  "metadata": {
    "name": "HPLC Analyzer",
    "manufacturer": "Agilent",
    "model": "1260 Infinity II",
    "serial_number": "HPLC78901",
    "capabilities": ["sample_analysis", "flow_control", "pressure_monitoring"]
  }
}
```

**WebSocket Device (e.g., Digital Microscope)**
```json
{
  "device_id": "microscope_leica_001",
  "protocol": "WebSocket",
  "connection_details": {
    "websocket_url": "ws://192.168.1.121:9000/stream",
    "protocol": "v1.microscope"
  },
  "metadata": {
    "name": "Digital Microscope",
    "manufacturer": "Leica",
    "model": "DM6 B",
    "serial_number": "DM12345",
    "capabilities": ["live_imaging", "magnification_control", "lighting_control"]
  }
}
```

### Step 2: Register the Device with LCP

Use the LCP API to register your device:

```bash
curl -X POST http://localhost:3000/api/lcp/register \
  -H "Content-Type: application/json" \
  -d @device_registration.json
```

## Protocol-Specific Integration

### MQTT Devices

1. **Set up MQTT Broker**:
   - Ensure your MQTT broker (e.g., Mosquitto) is running and accessible
   - Configure your device to publish to the topics specified in registration

2. **Configure Device**:
   - Program your device to publish data in JSON format:
   ```json
   {
     "temperature": 35.5,
     "pressure": 1.2,
     "status": "printing"
   }
   ```
   - Configure it to subscribe to the control topic for receiving commands

3. **Data Flow**:
   - Device publishes data → MQTT broker → LCP MQTT adapter → Standardized format → Database/Canvas

### REST API Devices

1. **API Endpoint Configuration**:
   - Ensure your device's API is accessible over the network
   - Document all available endpoints for data retrieval and control

2. **Authentication Setup**:
   - Generate and configure any required API keys
   - Set up appropriate permissions

3. **Integration Pattern**:
   - LCP will poll your device's API at the specified interval
   - Alternatively, your device can push data to LCP's data endpoint

### WebSocket Devices

1. **WebSocket Server**:
   - Ensure your device's WebSocket server is running and accessible
   - Configure any required authentication

2. **Data Format**:
   - Ensure your device sends data in a consistent JSON format
   - Document the message types and structure

3. **Connection Management**:
   - LCP will maintain a WebSocket connection to your device
   - Implement reconnection logic if needed

## Testing the Integration

### 1. Verify Device Registration

Check if your device appears in the devices list:

```bash
curl http://localhost:3000/api/lcp/devices
```

### 2. Test Data Reception

For each protocol:

- **MQTT**: Publish test data to the device's data topic
- **REST**: Check if data is being polled correctly
- **WebSocket**: Send test messages through the WebSocket connection

Verify data reception:

```bash
curl http://localhost:3000/api/lcp/devices/{device_id}/data
```

### 3. Test Device Control

Send a command to your device:

```bash
curl -X POST http://localhost:3000/api/lcp/control \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "your_device_id",
    "command": "set_temperature",
    "parameters": {
      "temperature": 37.5
    }
  }'
```

Verify that your device receives and executes the command.

## Troubleshooting

### Common Issues

1. **Connection Failures**:
   - Check network connectivity
   - Verify firewall settings
   - Confirm device is powered on and online

2. **Authentication Errors**:
   - Verify credentials in connection_details
   - Check for expired tokens
   - Ensure proper permissions

3. **Data Format Issues**:
   - Validate JSON structure
   - Check for missing required fields
   - Verify timestamp format (ISO 8601)

### Logs and Debugging

1. **Check LCP Server Logs**:
   Look for error messages related to your device.

2. **Enable Debug Mode**:
   Set `DEBUG=lcp:*` in your environment to see detailed logs.

3. **Protocol-Specific Debugging**:
   - MQTT: Use an MQTT client like MQTT Explorer to monitor topics
   - REST: Use Postman to test API endpoints directly
   - WebSocket: Use websocat to connect to the WebSocket endpoint

## Advanced Configuration

### Custom Data Transformations

If your device outputs data in a non-standard format, you may need to create a custom transformation:

1. Create a transformation function in `lcp/transformations/{device_type}.js`
2. Register it with the device service
3. The transformation will be applied automatically to incoming data

### Device Capabilities Documentation

For complex devices, create a capabilities document that maps:
- Device-specific commands to LCP standard commands
- Device-specific parameters to LCP standard parameters
- Data output fields to standardized metrics

### High-Frequency Data Handling

For devices with high-frequency data output:
1. Configure appropriate throttling/sampling rates
2. Consider enabling data aggregation
3. Set up dedicated data storage if needed

---

## Need Help?

If you encounter issues integrating your device, please:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review our [FAQ](FAQ.md)
3. Open an issue on our GitHub repository with:
   - Device specifications
   - Error messages
   - Steps to reproduce

The LCP team is committed to supporting integration with new laboratory devices. 
