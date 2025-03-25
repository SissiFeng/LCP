# WebSocket Protocol Specification for LCP

## Overview

The WebSocket protocol adapter provides real-time, bidirectional communication between laboratory devices and the LCP server.

## Connection

### WebSocket URL Format
```ws://{host}:{port}/lcp/ws/{device_id}
```

### Connection Parameters
- `device_id`: Unique identifier for the device
- `token`: Authentication token (passed in headers)

### Authentication
```javascript
{
  "headers": {
    "Authorization": "Bearer {token}"
  }
}
```

## Message Format

### Base Message Structure
```javascript
{
  "type": "command" | "response" | "event" | "error",
  "id": "unique-message-id",
  "timestamp": "ISO8601-timestamp",
  "payload": {
    // Message specific content
  }
}
```

### Command Message
```javascript
{
  "type": "command",
  "id": "cmd-123",
  "timestamp": "2024-03-25T10:00:00Z",
  "payload": {
    "command": "START",
    "parameters": {
      // Command specific parameters
    }
  }
}
```

### Response Message
```javascript
{
  "type": "response",
  "id": "cmd-123",
  "timestamp": "2024-03-25T10:00:01Z",
  "payload": {
    "status": "success" | "error",
    "data": {
      // Response data
    }
  }
}
```

### Event Message
```javascript
{
  "type": "event",
  "id": "evt-456",
  "timestamp": "2024-03-25T10:00:02Z",
  "payload": {
    "event": "STATUS_CHANGE",
    "data": {
      // Event specific data
    }
  }
}
```

### Error Message
```javascript
{
  "type": "error",
  "id": "err-789",
  "timestamp": "2024-03-25T10:00:03Z",
  "payload": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {
      // Additional error information
    }
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

## Events

### Standard Events
- CONNECTED
- DISCONNECTED
- STATUS_CHANGED
- DATA_AVAILABLE
- ERROR_OCCURRED

### Status Updates
- IDLE
- RUNNING
- PAUSED
- ERROR
- COMPLETED

## Error Handling

### Error Categories
1. Connection Errors
2. Authentication Errors
3. Command Errors
4. Device Errors
5. Protocol Errors

### Error Response Format
```javascript
{
  "type": "error",
  "id": "err-789",
  "timestamp": "2024-03-25T10:00:03Z",
  "payload": {
    "code": "AUTH_ERROR",
    "message": "Authentication failed",
    "details": {
      "reason": "Invalid token"
    }
  }
}
```

## Connection Management

### Heartbeat
- Client sends PING every 30 seconds
- Server responds with PONG
- Connection considered dead after 90 seconds of no response

### Reconnection
- Exponential backoff strategy
- Maximum retry attempts: 5
- Maximum backoff time: 60 seconds

## Security

### Transport Security
- WSS (WebSocket Secure) required for production
- TLS 1.2 or higher

### Authentication
- JWT token based authentication
- Token refresh mechanism
- Session management

## Performance Considerations

### Message Size
- Maximum message size: 1MB
- Recommended message size: <100KB

### Rate Limiting
- Maximum 100 messages per second per connection
- Burst allowance: 200 messages

## Implementation Guidelines

### Connection Setup
```javascript
const ws = new WebSocket('ws://host:port/lcp/ws/device-id');
ws.onopen = () => {
  // Connection established
};
```

### Message Handling
```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  switch(message.type) {
    case 'command':
      handleCommand(message);
      break;
    case 'response':
      handleResponse(message);
      break;
    case 'event':
      handleEvent(message);
      break;
    case 'error':
      handleError(message);
      break;
  }
};
```

### Error Handling
```javascript
ws.onerror = (error) => {
  // Handle connection errors
};

ws.onclose = (event) => {
  // Handle connection close
  // Implement reconnection logic
};
```

## Best Practices

1. **Message Handling**
   - Validate all messages
   - Implement timeout handling
   - Log all errors

2. **Connection Management**
   - Implement heartbeat mechanism
   - Handle reconnection gracefully
   - Clean up resources on disconnect

3. **Security**
   - Validate all input
   - Implement rate limiting
   - Use secure connections 
