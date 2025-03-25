# Laboratory Communication Protocol (LCP) Specification

## Overview

LCP (Laboratory Communication Protocol) 是一个用于实验室设备通信的标准化协议。它的目标是为实验室自动化提供一个统一的、可扩展的通信接口标准。

## Core Concepts

- **Device Abstraction**: 将不同类型的实验室设备抽象为标准接口
- **Protocol Independence**: 支持多种通信协议（REST/MQTT/WebSocket/gRPC）
- **Extensibility**: 可以轻松扩展以支持新的设备类型和功能
- **Standardization**: 统一的命令集、状态码和错误处理机制

## Table of Contents

1. [Getting Started](./getting-started.md)
   - Quick Start Guide
   - Installation
   - Basic Concepts

2. [Core Specifications](./core-spec.md)
   - Device Categories
   - Standard Commands
   - Device States
   - Data Types
   - Units

3. [Communication Protocols](./protocols/README.md)
   - REST API
   - MQTT
   - WebSocket
   - gRPC (Coming Soon)

4. [Device Integration](./device-integration/README.md)
   - Device Descriptor Format
   - Registration Process
   - Validation Rules
   - Testing Guidelines

5. [API Reference](./api-reference/README.md)
   - Command API
   - Status API
   - Configuration API
   - Error Handling

6. [Data Formats](./data-formats/README.md)
   - Command Format
   - Status Format
   - Error Format
   - Event Format

7. [Examples](./examples/README.md)
   - Liquid Handler
   - Thermal Controller
   - Measurement Device

8. [Client Libraries](./client-libraries/README.md)
   - Python Client
   - JavaScript Client
   - Other Languages

9. [Testing & Validation](./testing/README.md)
   - Compliance Testing
   - Virtual Device Testing
   - Integration Testing

10. [Best Practices](./best-practices/README.md)
    - Security Guidelines
    - Error Handling
    - Performance Optimization
    - Logging

## Version

Current Version: 1.0.0

## Contributing

我们欢迎社区贡献来改进LCP规范。请查看[贡献指南](./CONTRIBUTING.md)了解如何参与。

## License

Apache License 2.0 
