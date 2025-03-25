from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Union, Any
from enum import Enum
from datetime import datetime

class DeviceType(str, Enum):
    """Supported device types"""
    PUMP = "pump"
    TEMPERATURE_CONTROLLER = "temperature_controller"
    BALANCE = "balance"
    STIRRER = "stirrer"
    CUSTOM = "custom"

class DeviceMode(str, Enum):
    """Device simulation modes"""
    NORMAL = "normal"  # Normal operation with standard delays
    FAST = "fast"     # Fast operation with minimal delays
    UNSTABLE = "unstable"  # Random errors and delays
    CUSTOM = "custom"  # Custom behavior defined in config

class OperationType(str, Enum):
    """Supported operation types"""
    START = "start"
    STOP = "stop"
    PAUSE = "pause"
    RESUME = "resume"
    RESET = "reset"

class DeviceStatus(str, Enum):
    """Device status types"""
    IDLE = "idle"
    BUSY = "busy"
    ERROR = "error"
    MAINTENANCE = "maintenance"
    OFFLINE = "offline"

class SimulationConfig(BaseModel):
    """Configuration for device simulation behavior"""
    operation_delay: float = Field(
        default=1.0,
        description="Base delay for operations in seconds"
    )
    error_probability: float = Field(
        default=0.1,
        description="Probability of operation failure (0-1)"
    )
    data_update_interval: float = Field(
        default=1.0,
        description="Interval for data updates in seconds"
    )
    custom_behaviors: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Custom behavior definitions"
    )

class DeviceConfig(BaseModel):
    """Configuration for a simulated device"""
    device_type: DeviceType
    mode: DeviceMode = Field(default=DeviceMode.NORMAL)
    capabilities: List[str] = Field(default_factory=list)
    parameters: Dict[str, Any] = Field(default_factory=dict)
    simulation_config: Optional[SimulationConfig] = None

class OperationRequest(BaseModel):
    """Request to start a device operation"""
    operation_type: OperationType
    parameters: Dict[str, Any] = Field(default_factory=dict)
    timeout: Optional[float] = None

class OperationResponse(BaseModel):
    """Response from starting an operation"""
    operation_id: str
    status: str
    start_time: datetime
    estimated_completion: Optional[datetime] = None
    parameters: Dict[str, Any]

class DeviceResponse(BaseModel):
    """Response from creating a device"""
    device_id: str
    status: str
    config: DeviceConfig

class DeviceData(BaseModel):
    """Device data reading"""
    timestamp: datetime
    data_type: str
    value: Any
    unit: Optional[str] = None

class DeviceError(BaseModel):
    """Device error information"""
    error_code: str
    message: str
    timestamp: datetime
    details: Optional[Dict[str, Any]] = None 
