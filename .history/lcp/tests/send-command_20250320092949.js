const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

// Get command from command line arguments
const deviceId = process.argv[2] || 'test-device-001';
const command = process.argv[3] || 'getStatus';
const params = process.argv[4] ? JSON.parse(process.argv[4]) : {};

const commandData = {
  id: Date.now().toString(),
  device_id: deviceId,
  command,
  parameters: params,
  timestamp: new Date().toISOString()
};

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Subscribe to command response topic
  const responseTopic = `lcp/devices/${deviceId}/command_response`;
  client.subscribe(responseTopic, (err) => {
    if (!err) {
      console.log(`Subscribed to ${responseTopic}`);
      
      // Send command
      const commandTopic = `lcp/devices/${deviceId}/commands`;
      client.publish(commandTopic, JSON.stringify(commandData));
      console.log('Sent command:', commandData);
    }
  });
});

// Handle command response
client.on('message', (topic, message) => {
  const response = JSON.parse(message.toString());
  console.log('Received response:', response);
  
  // Exit after receiving response
  setTimeout(() => {
    client.end();
    process.exit(0);
  }, 500);
});

// Error handler
client.on('error', (err) => {
  console.error('MQTT client error:', err);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('Command timed out');
  client.end();
  process.exit(1);
}, 10000); 
