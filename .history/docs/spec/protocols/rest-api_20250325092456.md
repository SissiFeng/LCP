# LCP REST API Specification

## Base URL

```
https://{host}:{port}/api/v1
```

## Authentication

所有API请求都需要在Header中包含API Key：

```
Authorization: Bearer {api_key}
```

## Endpoints

### Device Management

#### 注册设备

```http
POST /devices
```

请求体：
```json
{
    "device_descriptor": {
        // Device Descriptor Object
    }
}
```

响应：
```json
{
    "device_id": "unique_device_id",
    "status": "registered",
    "registration_time": "ISO8601_TIMESTAMP"
}
```

#### 获取设备列表

```http
GET /devices
```

查询参数：
- `category`: 设备类别
- `status`: 设备状态
- `page`: 页码
- `limit`: 每页数量

响应：
```json
{
    "devices": [
        {
            "device_id": "device_1",
            "name": "Device Name",
            "category": "liquid_handling",
            "status": "idle"
        }
    ],
    "total": 100,
    "page": 1,
    "limit": 10
}
```

#### 获取设备详情

```http
GET /devices/{device_id}
```

响应：
```json
{
    "device_id": "device_1",
    "device_info": {
        // Device Info Object
    },
    "status": "idle",
    "capabilities": {
        // Capabilities Object
    }
}
```

### Device Control

#### 发送命令

```http
POST /devices/{device_id}/commands
```

请求体：
```json
{
    "command": "start",
    "parameters": {
        // Command Parameters
    }
}
```

响应：
```json
{
    "command_id": "cmd_123",
    "status": "accepted",
    "timestamp": "ISO8601_TIMESTAMP"
}
```

#### 获取命令状态

```http
GET /devices/{device_id}/commands/{command_id}
```

响应：
```json
{
    "command_id": "cmd_123",
    "status": "completed",
    "result": {
        // Command Result
    },
    "timestamp": "ISO8601_TIMESTAMP"
}
```

#### 获取设备状态

```http
GET /devices/{device_id}/status
```

响应：
```json
{
    "state": "idle",
    "parameters": {
        // Current Parameters
    },
    "timestamp": "ISO8601_TIMESTAMP"
}
```

### Device Configuration

#### 更新配置

```http
PUT /devices/{device_id}/configuration
```

请求体：
```json
{
    "parameters": {
        // Configuration Parameters
    }
}
```

响应：
```json
{
    "status": "updated",
    "timestamp": "ISO8601_TIMESTAMP"
}
```

#### 获取配置

```http
GET /devices/{device_id}/configuration
```

响应：
```json
{
    "parameters": {
        // Current Configuration
    },
    "last_updated": "ISO8601_TIMESTAMP"
}
```

### Data Management

#### 获取设备数据

```http
GET /devices/{device_id}/data
```

查询参数：
- `start_time`: ISO8601时间戳
- `end_time`: ISO8601时间戳
- `type`: 数据类型
- `limit`: 返回记录数量

响应：
```json
{
    "data": [
        {
            "timestamp": "ISO8601_TIMESTAMP",
            "type": "measurement",
            "value": {
                // Data Value
            }
        }
    ],
    "total": 100
}
```

## Status Codes

| 状态码 | 描述 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 未授权 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器错误 |

## Error Responses

所有错误响应都遵循以下格式：

```json
{
    "error": {
        "code": "ERROR_CODE",
        "message": "Error description",
        "details": {
            // Additional Error Details
        }
    }
}
```

## Rate Limiting

- 默认限制：100次请求/分钟
- 超出限制返回429状态码
- 在响应Header中包含限制信息：
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset

## Versioning

- API版本在URL中指定：`/api/v1`
- 主要版本更新可能包含破坏性更改
- 在响应Header中包含当前API版本：`X-API-Version`

## Pagination

列表接口支持分页：
- `page`: 页码（从1开始）
- `limit`: 每页数量（默认10，最大100）
- 响应中包含分页信息：
  ```json
  {
      "data": [],
      "pagination": {
          "total": 100,
          "page": 1,
          "limit": 10,
          "pages": 10
      }
  }
  ``` 
