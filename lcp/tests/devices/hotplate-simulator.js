const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

const deviceId = 'hotplate-001';
const deviceInfo = {
  device_id: deviceId,
  protocol: 'mqtt',
  model: 'IKA RET',
  capabilities: ['temperature', 'stirring'],
  metadata: {
    max_temperature: 350,
    min_temperature: 0,
    max_stirring_speed: 1500
  }
};

let currentState = {
  temperature: 25,
  target_temperature: 25,
  stirring_speed: 0,
  target_stirring_speed: 0,
  heating: false,
  stirring: false
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
        // Simulate temperature changes
        if (currentState.heating) {
          if (currentState.temperature < currentState.target_temperature) {
            currentState.temperature += 0.5;
          } else if (currentState.temperature > currentState.target_temperature) {
            currentState.temperature -= 0.2;
          }
        } else if (currentState.temperature > 25) {
          currentState.temperature -= 0.1;
        }
        
        const data = {
          device_id: deviceId,
          timestamp: new Date().toISOString(),
          parameters: {
            current_temperature: currentState.temperature,
            target_temperature: currentState.target_temperature,
            current_stirring_speed: currentState.stirring_speed,
            target_stirring_speed: currentState.target_stirring_speed,
            heating: currentState.heating,
            stirring: currentState.stirring
          }
        };
        
        client.publish(`lcp/devices/${deviceId}/data`, JSON.stringify(data));
        console.log('Published data:', data);
      }, 2000);
    }
  });
});

// Command handler
client.on('message', (topic, message) => {
  if (topic === `lcp/devices/${deviceId}/commands`) {
    const command = JSON.parse(message.toString());
    console.log('Received command:', command);
    
    switch (command.command) {
      case 'setTemperature':
        if (command.parameters.target <= deviceInfo.metadata.max_temperature &&
            command.parameters.target >= deviceInfo.metadata.min_temperature) {
          currentState.target_temperature = command.parameters.target;
          currentState.heating = true;
        }
        break;
      case 'setStirringSpeed':
        if (command.parameters.speed <= deviceInfo.metadata.max_stirring_speed &&
            command.parameters.speed >= 0) {
          currentState.target_stirring_speed = command.parameters.speed;
          currentState.stirring = command.parameters.speed > 0;
          currentState.stirring_speed = command.parameters.speed;
        }
        break;
      case 'stop':
        currentState.heating = false;
        currentState.stirring = false;
        currentState.target_temperature = 25;
        currentState.target_stirring_speed = 0;
        currentState.stirring_speed = 0;
        break;
    }
    
    // Send command response
    const response = {
      device_id: deviceId,
      command_id: command.id,
      status: 'completed',
      timestamp: new Date().toISOString()
    };
    
    client.publish(`lcp/devices/${deviceId}/command_response`, JSON.stringify(response));
  }
});

// Error handler
client.on('error', (err) => {
  console.error('MQTT client error:', err);
});

// Close handler
process.on('SIGINT', () => {
  client.end();
  process.exit();
}); 
