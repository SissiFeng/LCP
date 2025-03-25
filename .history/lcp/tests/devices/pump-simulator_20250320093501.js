const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

const deviceId = 'pump-001';
const deviceInfo = {
  device_id: deviceId,
  protocol: 'mqtt',
  model: 'Peristaltic Pump',
  capabilities: ['flow_rate', 'direction'],
  metadata: {
    max_flow_rate: 100, // mL/min
    min_flow_rate: 0,
    directions: ['forward', 'reverse']
  }
};

let currentState = {
  flow_rate: 0,
  target_flow_rate: 0,
  direction: 'forward',
  running: false,
  total_volume: 0,
  last_update: Date.now()
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
        const now = Date.now();
        const elapsed = (now - currentState.last_update) / 1000; // seconds
        
        if (currentState.running) {
          // Calculate volume pumped since last update
          const volume = (currentState.flow_rate * elapsed) / 60; // Convert from mL/min to mL
          currentState.total_volume += volume;
        }
        
        currentState.last_update = now;
        
        const data = {
          device_id: deviceId,
          timestamp: new Date().toISOString(),
          parameters: {
            current_flow_rate: currentState.flow_rate,
            target_flow_rate: currentState.target_flow_rate,
            direction: currentState.direction,
            running: currentState.running,
            total_volume: currentState.total_volume
          }
        };
        
        client.publish(`lcp/devices/${deviceId}/data`, JSON.stringify(data));
        console.log('Published data:', data);
      }, 1000);
    }
  });
});

// Command handler
client.on('message', (topic, message) => {
  if (topic === `lcp/devices/${deviceId}/commands`) {
    const command = JSON.parse(message.toString());
    console.log('Received command:', command);
    
    switch (command.command) {
      case 'setFlowRate':
        if (command.parameters.flow_rate <= deviceInfo.metadata.max_flow_rate &&
            command.parameters.flow_rate >= deviceInfo.metadata.min_flow_rate) {
          currentState.target_flow_rate = command.parameters.flow_rate;
          currentState.flow_rate = command.parameters.flow_rate;
          currentState.running = command.parameters.flow_rate > 0;
        }
        break;
      case 'setDirection':
        if (deviceInfo.metadata.directions.includes(command.parameters.direction)) {
          currentState.direction = command.parameters.direction;
        }
        break;
      case 'stop':
        currentState.running = false;
        currentState.flow_rate = 0;
        currentState.target_flow_rate = 0;
        break;
      case 'resetVolume':
        currentState.total_volume = 0;
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
