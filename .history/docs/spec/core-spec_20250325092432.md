# LCP Core Specifications

## Device Categories

LCP定义了以下标准设备类别：

| 类别 | 标识符 | 描述 | 示例设备 |
|------|--------|------|----------|
| Liquid Handling | `liquid_handling` | 液体处理设备 | 移液器、蠕动泵 |
| Thermal Control | `thermal_control` | 温度控制设备 | 加热板、恒温器 |
| Measurement | `measurement` | 测量设备 | pH计、分光光度计 |
| Separation | `separation` | 分离设备 | 离心机、色谱仪 |
| Imaging | `imaging` | 成像设备 | 显微镜、相机 |
| Storage | `storage` | 存储设备 | 样品库、冰箱 |
| Robotics | `robotics` | 机器人设备 | 机械臂、传送带 |

## Standard Commands

每个LCP兼容设备必须实现以下基础命令：

### 必需命令

| 命令 | 描述 | 参数 | 响应 |
|------|------|------|------|
| `start` | 启动设备操作 | 可选，取决于操作类型 | 操作ID，状态 |
| `stop` | 停止当前操作 | 操作ID | 确认状态 |
| `status` | 获取设备状态 | 无 | 当前状态，参数 |
| `configure` | 配置设备参数 | 配置参数对象 | 配置确认 |
| `reset` | 重置设备 | 无 | 重置确认 |
| `calibrate` | 校准设备 | 校准参数 | 校准状态 |

### 命令格式

所有命令必须遵循以下JSON格式：

```json
{
    "command": "command_name",
    "parameters": {
        "param1": "value1",
        "param2": "value2"
    },
    "timestamp": "ISO8601_TIMESTAMP",
    "id": "unique_command_id"
}
```

## Device States

标准设备状态定义：

| 状态 | 描述 | 允许的命令 |
|------|------|------------|
| `idle` | 设备空闲 | 所有命令 |
| `running` | 正在执行操作 | status, stop |
| `error` | 错误状态 | status, reset |
| `maintenance` | 维护模式 | status, reset |
| `calibrating` | 正在校准 | status, stop |
| `disconnected` | 连接断开 | status |

### 状态报告格式

```json
{
    "state": "device_state",
    "parameters": {
        "param1": "value1",
        "param2": "value2"
    },
    "timestamp": "ISO8601_TIMESTAMP",
    "errors": []
}
```

## Data Types

| 类型 | 描述 | 格式 | 示例 |
|------|------|------|------|
| `number` | 数值类型 | 数字 | 123, 45.67 |
| `string` | 字符串 | 文本 | "sample_1" |
| `boolean` | 布尔值 | true/false | true |
| `enum` | 枚举值 | 预定义选项 | "option1" |
| `object` | 对象 | JSON对象 | {"key": "value"} |
| `array` | 数组 | JSON数组 | [1, 2, 3] |

## Units

LCP使用标准国际单位制(SI)，定义了以下常用单位：

### 温度
- `celsius`: 摄氏度 (°C)
- `fahrenheit`: 华氏度 (°F)
- `kelvin`: 开尔文 (K)

### 体积
- `milliliter`: 毫升 (mL)
- `microliter`: 微升 (µL)
- `nanoliter`: 纳升 (nL)

### 时间
- `second`: 秒 (s)
- `minute`: 分 (min)
- `hour`: 小时 (h)

### 距离
- `millimeter`: 毫米 (mm)
- `micrometer`: 微米 (µm)

### 速度
- `mm_per_second`: 毫米/秒 (mm/s)
- `rpm`: 转/分钟 (rpm)

### 压力
- `pascal`: 帕斯卡 (Pa)
- `bar`: 巴 (bar)
- `psi`: 磅/平方英寸 (psi)

## Error Handling

### 错误类别

| 类别 | 描述 | 示例 |
|------|------|------|
| `communication_error` | 通信相关错误 | 连接超时 |
| `hardware_error` | 硬件相关错误 | 电机故障 |
| `validation_error` | 验证相关错误 | 参数无效 |
| `protocol_error` | 协议相关错误 | 命令格式错误 |
| `system_error` | 系统相关错误 | 内存不足 |

### 错误响应格式

```json
{
    "error": {
        "code": "ERROR_CODE",
        "category": "error_category",
        "message": "Error description",
        "details": {
            "param1": "value1",
            "param2": "value2"
        },
        "timestamp": "ISO8601_TIMESTAMP"
    }
}
```

## 版本控制

- LCP使用语义化版本控制 (Semantic Versioning)
- 版本格式：MAJOR.MINOR.PATCH
- 向后兼容性保证在MINOR和PATCH版本更新中维持 
