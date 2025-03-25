const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

const deviceId = 'valve-001';
const deviceInfo = {
  device_id: deviceId,
  protocol: 'mqtt',
  model: 'Solenoid Valve',
  capabilities: ['position', 'flow_control'],
  metadata: {
    positions: ['open', 'closed'],
    type: 'binary', // or 'proportional' for valves that can be partially open
    response_time: 100, // milliseconds
    ports: ['inlet', 'outlet']
  }
};

let currentState = {
  position: 'closed',
  target_position: 'closed',
  transitioning: false,
  last_command: null,
  cycles: 0, // Count of open/close cycles
  error: null
};

// Connect handler
client.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Subscribe to command topic
  const commandTopic = `lcp/devices/${deviceId}/commands`;
  client.subscribe(commandTopic, (err) => {
    if (!err) {
      console.log(`Subscribed to ${commandTopic}`);
      
      // Register device
      client.publish('lcp/devices/register', JSON.stringify(deviceInfo));
      
      // Start sending simulated data
      setInterval(() => {
        const data = {
          device_id: deviceId,
          timestamp: new Date().toISOString(),
          parameters: {
            position: currentState.position,
            target_position: currentState.target_position,
            transitioning: currentState.transitioning,
            cycles: currentState.cycles,
            error: currentState.error
          }
        };
        
        client.publish(`lcp/devices/${deviceId}/data`, JSON.stringify(data));
        console.log('Published data:', data);
      }, 200); // Fast updates for valve status
    }
  });
});

// Simulate valve movement
function simulateValveMovement(targetPosition) {
  if (currentState.position === targetPosition) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    currentState.transitioning = true;
    currentState.target_position = targetPosition;
    
    // Simulate valve movement time
    setTimeout(() => {
      if (Math.random() < 0.99) { // 1% chance of failure
        currentState.position = targetPosition;
        currentState.transitioning = false;
        if (targetPosition === 'open' || targetPosition === 'closed') {
          currentState.cycles++;
        }
        resolve();
      } else {
        currentState.transitioning = false;
        currentState.error = 'Valve movement failed';
        reject(new Error('Valve movement failed'));
      }
    }, deviceInfo.metadata.response_time);
  });
}

// Command handler
client.on('message', (topic, message) => {
  if (topic === `lcp/devices/${deviceId}/commands`) {
    const command = JSON.parse(message.toString());
    console.log('Received command:', command);
    
    let status = 'completed';
    currentState.error = null;
    currentState.last_command = command;
    
    switch (command.command) {
      case 'setPosition':
        if (deviceInfo.metadata.positions.includes(command.parameters.position)) {
          simulateValveMovement(command.parameters.position)
            .then(() => {
              const response = {
                device_id: deviceId,
                command_id: command.id,
                status: 'completed',
                timestamp: new Date().toISOString()
              };
              client.publish(`lcp/devices/${deviceId}/command_response`, JSON.stringify(response));
              
              // Publish position changed event
              client.publish(`lcp/devices/${deviceId}/events`, JSON.stringify({
                device_id: deviceId,
                event: 'position_changed',
                data: { position: command.parameters.position },
                timestamp: new Date().toISOString()
              }));
            })
            .catch(err => {
              const response = {
                device_id: deviceId,
                command_id: command.id,
                status: 'error',
                error: err.message,
                timestamp: new Date().toISOString()
              };
              client.publish(`lcp/devices/${deviceId}/command_response`, JSON.stringify(response));
            });
          return; // Don't send immediate response
        } else {
          status = 'error';
          currentState.error = 'Invalid position';
        }
        break;
      case 'emergency_close':
        // Emergency close is immediate
        currentState.position = 'closed';
        currentState.target_position = 'closed';
        currentState.transitioning = false;
        currentState.cycles++;
        break;
      case 'reset':
        currentState.cycles = 0;
        currentState.error = null;
        break;
    }
    
    // Send command response
    const response = {
      device_id: deviceId,
      command_id: command.id,
      status,
      error: currentState.error,
      timestamp: new Date().toISOString()
    };
    
    client.publish(`lcp/devices/${deviceId}/command_response`, JSON.stringify(response));
  }
});

// Error handler
client.on('error', (err) => {
  console.error('MQTT client error:', err);
  currentState.error = err.message;
});

// Close handler
process.on('SIGINT', () => {
  // Ensure valve is closed on shutdown
  currentState.position = 'closed';
  currentState.target_position = 'closed';
  
  const data = {
    device_id: deviceId,
    timestamp: new Date().toISOString(),
    parameters: {
      position: currentState.position,
      target_position: currentState.target_position,
      transitioning: false,
      cycles: currentState.cycles,
      error: 'Device shutting down'
    }
  };
  
  client.publish(`lcp/devices/${deviceId}/data`, JSON.stringify(data), {}, () => {
    client.end();
    process.exit();
  });
}); 
