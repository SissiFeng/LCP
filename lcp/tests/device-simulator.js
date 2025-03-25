const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

const deviceId = 'test-device-001';
const deviceInfo = {
  device_id: deviceId,
  protocol: 'mqtt',
  model: 'simulator',
  capabilities: ['temperature', 'humidity']
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
            temperature: 20 + Math.random() * 5,
            humidity: 40 + Math.random() * 20
          }
        };
        
        client.publish(`lcp/devices/${deviceId}/data`, JSON.stringify(data));
        console.log('Published data:', data);
      }, 5000); // Send data every 5 seconds
    }
  });
});

// Command handler
client.on('message', (topic, message) => {
  if (topic === `lcp/devices/${deviceId}/commands`) {
    const command = JSON.parse(message.toString());
    console.log('Received command:', command);
    
    // Simulate command execution
    setTimeout(() => {
      const response = {
        device_id: deviceId,
        command_id: command.id,
        status: 'completed',
        timestamp: new Date().toISOString()
      };
      
      client.publish(`lcp/devices/${deviceId}/command_response`, JSON.stringify(response));
      console.log('Published command response:', response);
    }, 1000);
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
