# LCP Fake Device Farm

A mock LCP server for testing and development. This service simulates various lab devices for testing and development purposes.

## Features

- Simulates multiple device types (pump, temperature controller, balance, stirrer)
- Configurable simulation modes (normal, fast, unstable)
- Real-time data generation
- Operation simulation with configurable delays and errors
- REST API compatible with LCP protocol
- Docker support for easy deployment

## Quick Start

### Using Docker

```bash
# Pull the image
docker pull lcp/fake-device

# Run with default settings
docker run -p 8000:8000 lcp/fake-device

# Run with specific device type and mode
docker run -p 8000:8000 \
  -e LCP_FAKE_DEFAULT_OPERATION_DELAY=1.0 \
  -e LCP_FAKE_DEFAULT_ERROR_PROBABILITY=0.1 \
  lcp/fake-device
```

### Local Development

#### macOS (Apple Silicon/Intel)

1. 修复 Homebrew（如果需要）:
```bash
# 重新安装 Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 对于 Apple Silicon (M1/M2) Mac，添加 Homebrew 到 PATH
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc
```

2. 安装 uv:
```bash
# 确保 Homebrew 是最新的
brew update
brew install michaeleisel/zld/zld
brew install uv

# 验证安装
uv --version
```

3. 创建并激活虚拟环境:
```bash
# 创建项目目录（如果还没有）
mkdir -p ~/projects
cd ~/projects/lcp-fake-device

# 创建虚拟环境
python3 -m venv .venv

# 激活虚拟环境
source .venv/bin/activate
```

4. 安装依赖:
```bash
# 确保 pip 是最新的
python3 -m pip install --upgrade pip

# 使用 uv 安装依赖
uv pip install --upgrade -r requirements.txt
```

5. 运行服务器:
```bash
python3 -m uvicorn lcp_fake_device.main:app --host 0.0.0.0 --port 8000
```

#### Linux/WSL

1. 安装基础工具:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y python3-venv python3-pip curl

# CentOS/RHEL
sudo yum update
sudo yum install -y python3-venv python3-pip curl
```

2. 安装 uv:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh

# 添加 uv 到 PATH
export PATH="$HOME/.cargo/bin:$PATH"
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
```

3. 创建并激活虚拟环境:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

4. 安装依赖:
```bash
python3 -m pip install --upgrade pip
uv pip install --upgrade -r requirements.txt
```

5. 运行服务器:
```bash
python3 -m uvicorn lcp_fake_device.main:app --host 0.0.0.0 --port 8000
```

#### Windows

1. 安装 Python:
- 从 [python.org](https://www.python.org/downloads/) 下载并安装 Python 3.9+
- 安装时勾选 "Add Python to PATH"

2. 安装 uv:
```powershell
# 使用管理员权限运行 PowerShell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm https://astral.sh/uv/install.ps1 | iex

# 刷新环境变量
refreshenv
```

3. 创建并激活虚拟环境:
```powershell
python -m venv .venv
.venv\Scripts\activate
```

4. 安装依赖:
```powershell
python -m pip install --upgrade pip
uv pip install --upgrade -r requirements.txt
```

5. 运行服务器:
```powershell
python -m uvicorn lcp_fake_device.main:app --host 0.0.0.0 --port 8000
```

### 故障排除

如果遇到问题，请尝试以下步骤：

1. Python 版本问题:
```bash
# 检查 Python 版本
python3 --version  # 应该是 3.9+
```

2. 权限问题:
```bash
# macOS/Linux
sudo chown -R $(whoami) .venv/

# Windows (管理员 PowerShell)
takeown /F .venv /R
```

3. 依赖安装问题:
```bash
# 清理缓存
uv cache clean

# 使用传统 pip 安装（备选方案）
python3 -m pip install -r requirements.txt
```

4. 端口占用问题:
```bash
# 检查端口占用
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows
```

## API Endpoints

- `POST /devices` - Create a new simulated device
- `GET /devices` - List all simulated devices
- `GET /devices/{device_id}/status` - Get device status
- `POST /devices/{device_id}/operations` - Start an operation
- `DELETE /devices/{device_id}/operations/{operation_id}` - Stop an operation
- `DELETE /devices/{device_id}` - Remove a device

## Configuration

Environment variables:
- `LCP_FAKE_HOST` - Server host (default: 0.0.0.0)
- `LCP_FAKE_PORT` - Server port (default: 8000)
- `LCP_FAKE_DEBUG` - Debug mode (default: false)
- `LCP_FAKE_DEFAULT_OPERATION_DELAY` - Default operation delay in seconds
- `LCP_FAKE_DEFAULT_ERROR_PROBABILITY` - Default error probability
- `LCP_FAKE_DEFAULT_DATA_UPDATE_INTERVAL` - Default data update interval

## Device Types

### Pump
- Operations: START, STOP
- Data: flow_rate (mL/min), pressure (bar)

### Temperature Controller
- Operations: START, STOP
- Data: temperature (°C), humidity (%)

### Balance
- Operations: START, STOP
- Data: weight (g), stability (boolean)

### Stirrer
- Operations: START, STOP
- Data: speed (rpm), torque (N⋅m)

## Simulation Modes

1. Normal Mode
   - Standard operation delays
   - Normal error probability
   - Regular data updates

2. Fast Mode
   - Reduced operation delays
   - Quick response times
   - Rapid data updates

3. Unstable Mode
   - Random operation delays
   - Higher error probability
   - Irregular data updates

4. Custom Mode
   - Configurable behavior
   - Custom error patterns
   - Specific data generation rules

## Example Usage

```python
import requests
import json

# Create a simulated pump
device_config = {
    "device_type": "pump",
    "mode": "normal",
    "capabilities": ["flow_control", "pressure_monitoring"],
    "parameters": {
        "max_flow_rate": 10.0,
        "max_pressure": 5.0
    }
}

# Create device
response = requests.post(
    "http://localhost:8000/devices",
    json=device_config
)
device_id = response.json()["device_id"]

# Start an operation
operation = {
    "operation_type": "START",
    "parameters": {
        "flow_rate": 5.0
    }
}
response = requests.post(
    f"http://localhost:8000/devices/{device_id}/operations",
    json=operation
)
```

## Development

### Project Structure
```
lcp-fake-device/
├── lcp_fake_device/
│   ├── __init__.py
│   ├── main.py           # FastAPI application and routes
│   ├── models.py         # Data models and validation
│   ├── device_simulator.py # Device simulation logic
│   └── config.py         # Application configuration
├── tests/
│   ├── test_api.py      # API endpoint tests
│   └── test_device_simulator.py # Simulator unit tests
├── requirements.txt      # Python dependencies
├── pyproject.toml       # Poetry project configuration
└── README.md           # This file
```

### Running Tests
```bash
# Using pip
pytest

# Using Poetry
poetry run pytest
```
