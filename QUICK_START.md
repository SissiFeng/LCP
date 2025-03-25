# LCP Quick Start Guide

## What is LCP?

Laboratory Context Protocol (LCP) is a standardized communication protocol designed for laboratory equipment integration. It provides a unified interface for various laboratory devices, enabling seamless integration and operation within laboratory environments.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Basic understanding of laboratory equipment communication

## Quick Start Steps

### 1. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd lcp

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### 2. Configuration

Edit `.env` file with your specific settings:

```env
# Server Configuration
SERVER_PORT=3000
SERVER_HOST=localhost

# MQTT Configuration (if using MQTT devices)
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lcp_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

### 3. Running the Server

```bash
# Start the LCP server
node index.js
```

### 4. Adding a New Device

1. Create a device descriptor:
   ```bash
   cp templates/device-descriptor.js my-device-descriptor.js
   ```

2. Implement the LCP interface:
   ```bash
   cp templates/lcp_interface.py my_device/lcp_interface.py
   ```

3. Create device tests:
   ```bash
   cp templates/test_template.py my_device/tests/test_device.py
   ```

### 5. Validation

```bash
# Run the LCP validator
python tools/validator/lcp_validator.py --device-path my_device/
```

## Directory Structure

```
lcp/
├── adapters/          # Protocol adapters (MQTT, REST, WebSocket)
├── api/              # API endpoints
├── core/             # Core LCP functionality
├── docs/             # Documentation
│   └── spec/         # LCP specifications
├── examples/         # Example implementations
├── servers/          # Device-specific servers
├── templates/        # Templates for new devices
├── tools/            # Development and validation tools
└── tests/           # Test suites
```

## Common Use Cases

1. **Integrating a Simple Device**
   - Follow the temperature controller example in `examples/temperature_controller/`
   - Use the basic device template from `templates/`

2. **Adding Custom Commands**
   - Extend the device interface in `lcp_interface.py`
   - Update the device manifest
   - Add corresponding tests

3. **Using Different Protocols**
   - Check available adapters in `adapters/`
   - Configure the appropriate adapter in your device implementation

## Troubleshooting

Common issues and solutions:

1. **Connection Issues**
   - Verify environment variables in `.env`
   - Check network connectivity
   - Ensure device is powered and accessible

2. **Validation Errors**
   - Review device manifest against specification
   - Check implementation against templates
   - Run validator with `--verbose` flag

3. **Performance Issues**
   - Monitor device response times
   - Check network latency
   - Review operation logs

## Next Steps

- Read the full [LCP Specification](docs/spec/README.md)
- Check [Integration Guide](INTEGRATION_GUIDE.md)
- Review [Migration Guide](MIGRATION.md) for version updates
- Join the community (add links to forums/chat)

## Support

- Report issues on GitHub
- Check documentation in `docs/`
- Contact maintainers (add contact information) 
