const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

const deviceId = 'webcam-001';
const deviceInfo = {
  device_id: deviceId,
  protocol: 'mqtt',
  model: 'USB Webcam',
  capabilities: ['capture', 'stream', 'settings'],
  metadata: {
    resolutions: ['640x480', '1280x720', '1920x1080'],
    formats: ['MJPEG', 'YUY2'],
    features: ['autofocus', 'exposure', 'white_balance']
  }
};

let currentState = {
  streaming: false,
  resolution: '1280x720',
  format: 'MJPEG',
  settings: {
    autofocus: true,
    exposure: 'auto',
    white_balance: 'auto'
  },
  frame_count: 0,
  error: null
};

// Simulate frame generation
function generateDummyFrame() {
  const [width, height] = currentState.resolution.split('x').map(Number);
  return {
    timestamp: Date.now(),
    format: currentState.format,
    width,
    height,
    data: `dummy_frame_data_${currentState.frame_count}` // In real implementation, this would be image data
  };
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
        if (currentState.streaming) {
          currentState.frame_count++;
        }
        
        const data = {
          device_id: deviceId,
          timestamp: new Date().toISOString(),
          parameters: {
            streaming: currentState.streaming,
            resolution: currentState.resolution,
            format: currentState.format,
            settings: currentState.settings,
            frame_count: currentState.frame_count,
            error: currentState.error
          }
        };
        
        client.publish(`lcp/devices/${deviceId}/data`, JSON.stringify(data));
        console.log('Published data:', data);
        
        // If streaming, send frame data
        if (currentState.streaming) {
          const frame = generateDummyFrame();
          client.publish(`lcp/devices/${deviceId}/frame`, JSON.stringify(frame));
        }
      }, 1000 / 30); // 30 fps when streaming
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
      case 'startStream':
        if (!currentState.streaming) {
          currentState.streaming = true;
          // Publish stream started event
          client.publish(`lcp/devices/${deviceId}/events`, JSON.stringify({
            device_id: deviceId,
            event: 'stream_started',
            timestamp: new Date().toISOString()
          }));
        }
        break;
      case 'stopStream':
        if (currentState.streaming) {
          currentState.streaming = false;
          // Publish stream stopped event
          client.publish(`lcp/devices/${deviceId}/events`, JSON.stringify({
            device_id: deviceId,
            event: 'stream_stopped',
            timestamp: new Date().toISOString()
          }));
        }
        break;
      case 'capture':
        // Simulate single frame capture
        const frame = generateDummyFrame();
        client.publish(`lcp/devices/${deviceId}/capture`, JSON.stringify(frame));
        break;
      case 'setResolution':
        if (deviceInfo.metadata.resolutions.includes(command.parameters.resolution)) {
          currentState.resolution = command.parameters.resolution;
        } else {
          status = 'error';
          currentState.error = 'Invalid resolution';
        }
        break;
      case 'setFormat':
        if (deviceInfo.metadata.formats.includes(command.parameters.format)) {
          currentState.format = command.parameters.format;
        } else {
          status = 'error';
          currentState.error = 'Invalid format';
        }
        break;
      case 'updateSettings':
        const newSettings = command.parameters;
        // Validate and apply each setting
        if (newSettings.autofocus !== undefined) {
          currentState.settings.autofocus = Boolean(newSettings.autofocus);
        }
        if (newSettings.exposure !== undefined) {
          currentState.settings.exposure = newSettings.exposure;
        }
        if (newSettings.white_balance !== undefined) {
          currentState.settings.white_balance = newSettings.white_balance;
        }
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
  
  // Stop streaming on error
  if (currentState.streaming) {
    currentState.streaming = false;
    client.publish(`lcp/devices/${deviceId}/events`, JSON.stringify({
      device_id: deviceId,
      event: 'stream_error',
      error: err.message,
      timestamp: new Date().toISOString()
    }));
  }
});

// Close handler
process.on('SIGINT', () => {
  // Stop streaming if active
  if (currentState.streaming) {
    currentState.streaming = false;
    client.publish(`lcp/devices/${deviceId}/events`, JSON.stringify({
      device_id: deviceId,
      event: 'stream_stopped',
      timestamp: new Date().toISOString()
    }));
  }
  
  client.end();
  process.exit();
}); 
