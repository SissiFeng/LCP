const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

const deviceId = 'balance-001';
const deviceInfo = {
  device_id: deviceId,
  protocol: 'mqtt',
  model: 'Mettler Toledo',
  capabilities: ['weight', 'tare', 'calibration'],
  metadata: {
    max_weight: 2000, // grams
    min_weight: 0.001, // grams
    precision: 0.001, // grams
    units: ['g', 'mg', 'kg']
  }
};

let currentState = {
  weight: 0,
  tare_weight: 0,
  unit: 'g',
  stable: true,
  last_calibration: new Date().toISOString(),
  error: null
};

// Simulate environmental noise
function addNoise() {
  return (Math.random() - 0.5) * 0.002; // ±0.001g noise
}

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
        // Add some noise to simulate real measurement
        currentState.weight = Math.max(0, currentState.weight + addNoise());
        currentState.stable = Math.random() > 0.1; // 90% chance of being stable
        
        const data = {
          device_id: deviceId,
          timestamp: new Date().toISOString(),
          parameters: {
            weight: currentState.weight,
            tare_weight: currentState.tare_weight,
            net_weight: currentState.weight - currentState.tare_weight,
            unit: currentState.unit,
            stable: currentState.stable,
            last_calibration: currentState.last_calibration,
            error: currentState.error
          }
        };
        
        client.publish(`lcp/devices/${deviceId}/data`, JSON.stringify(data));
        console.log('Published data:', data);
      }, 500); // Update more frequently for weight measurements
    }
  });
});

// Command handler
client.on('message', (topic, message) => {
  if (topic === `lcp/devices/${deviceId}/commands`) {
    const command = JSON.parse(message.toString());
    console.log('Received command:', command);
    
    let status = 'completed';
    currentState.error = null;
    
    switch (command.command) {
      case 'tare':
        currentState.tare_weight = currentState.weight;
        break;
      case 'zero':
        currentState.weight = 0;
        currentState.tare_weight = 0;
        break;
      case 'setUnit':
        if (deviceInfo.metadata.units.includes(command.parameters.unit)) {
          currentState.unit = command.parameters.unit;
        } else {
          status = 'error';
          currentState.error = 'Invalid unit';
        }
        break;
      case 'calibrate':
        // Simulate calibration process
        currentState.stable = false;
        setTimeout(() => {
          currentState.stable = true;
          currentState.last_calibration = new Date().toISOString();
          currentState.weight = command.parameters.reference_weight || 0;
          currentState.error = null;
          
          // Send calibration complete notification
          client.publish(`lcp/devices/${deviceId}/events`, JSON.stringify({
            device_id: deviceId,
            event: 'calibration_complete',
            timestamp: new Date().toISOString()
          }));
        }, 5000);
        status = 'processing'; // Indicate that calibration is in progress
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
  client.end();
  process.exit();
}); 
