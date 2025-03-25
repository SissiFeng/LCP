import asyncio
import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
import logging
from .models import (
    DeviceConfig,
    DeviceStatus,
    OperationRequest,
    OperationResponse,
    DeviceData,
    DeviceError,
    DeviceMode,
    SimulationConfig
)

logger = logging.getLogger(__name__)

class DeviceSimulator:
    """Simulates a device with configurable behavior"""

    def __init__(self, device_id: str, config: DeviceConfig):
        self.device_id = device_id
        self.config = config
        self.status = DeviceStatus.IDLE
        self.current_operation: Optional[str] = None
        self.operation_tasks: Dict[str, asyncio.Task] = {}
        self.data_history: list[DeviceData] = []
        self.error_history: list[DeviceError] = []
        self.last_update = datetime.now()

        # Initialize simulation parameters
        self.sim_config = config.simulation_config or SimulationConfig()
        self._setup_device_specific_behavior()

    def _setup_device_specific_behavior(self):
        """Setup device-specific simulation behavior"""
        if self.config.device_type == "pump":
            self.data_generators = {
                "flow_rate": lambda: random.uniform(0.1, 10.0),
                "pressure": lambda: random.uniform(0.5, 5.0)
            }
        elif self.config.device_type == "temperature_controller":
            self.data_generators = {
                "temperature": lambda: random.uniform(20.0, 80.0),
                "humidity": lambda: random.uniform(30.0, 70.0)
            }
        elif self.config.device_type == "balance":
            self.data_generators = {
                "weight": lambda: random.uniform(0.001, 1000.0),
                "stability": lambda: random.choice([True, False])
            }
        elif self.config.device_type == "stirrer":
            self.data_generators = {
                "speed": lambda: random.uniform(50, 1000),
                "torque": lambda: random.uniform(0.1, 5.0)
            }
        else:
            self.data_generators = {
                "custom_value": lambda: random.random()
            }

    def get_status(self) -> Dict[str, Any]:
        """Get current device status"""
        return {
            "device_id": self.device_id,
            "status": self.status,
            "current_operation": self.current_operation,
            "last_update": self.last_update,
            "config": self.config.dict()
        }

    async def start_operation(self, operation: OperationRequest) -> OperationResponse:
        """Start a new operation on the device"""
        if self.status == DeviceStatus.BUSY:
            raise ValueError("Device is busy")

        operation_id = str(uuid.uuid4())
        start_time = datetime.now()
        
        # Calculate operation duration based on mode
        base_duration = self.sim_config.operation_delay
        if self.config.mode == DeviceMode.FAST:
            duration = base_duration * 0.5
        elif self.config.mode == DeviceMode.UNSTABLE:
            duration = base_duration * random.uniform(0.5, 2.0)
        else:
            duration = base_duration

        # Create and store the operation task
        task = asyncio.create_task(
            self._execute_operation(operation_id, operation, duration)
        )
        self.operation_tasks[operation_id] = task

        estimated_completion = start_time + timedelta(seconds=duration)
        
        return OperationResponse(
            operation_id=operation_id,
            status="started",
            start_time=start_time,
            estimated_completion=estimated_completion,
            parameters=operation.parameters
        )

    async def stop_operation(self, operation_id: str):
        """Stop an ongoing operation"""
        if operation_id in self.operation_tasks:
            task = self.operation_tasks[operation_id]
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
            del self.operation_tasks[operation_id]
            self.status = DeviceStatus.IDLE
            self.current_operation = None

    async def _execute_operation(
        self,
        operation_id: str,
        operation: OperationRequest,
        duration: float
    ):
        """Execute an operation with simulated behavior"""
        try:
            self.status = DeviceStatus.BUSY
            self.current_operation = operation_id

            # Simulate operation execution
            if self.config.mode == DeviceMode.UNSTABLE:
                if random.random() < self.sim_config.error_probability:
                    await asyncio.sleep(duration * random.uniform(0.1, 0.5))
                    raise Exception("Simulated operation failure")

            # Generate data during operation
            data_interval = self.sim_config.data_update_interval
            elapsed = 0
            while elapsed < duration:
                self._generate_and_store_data()
                await asyncio.sleep(data_interval)
                elapsed += data_interval

            await asyncio.sleep(max(0, duration - elapsed))

        except asyncio.CancelledError:
            logger.info(f"Operation {operation_id} cancelled")
            self._log_error("OPERATION_CANCELLED", "Operation was cancelled")
            raise

        except Exception as e:
            logger.error(f"Operation {operation_id} failed: {str(e)}")
            self.status = DeviceStatus.ERROR
            self._log_error("OPERATION_FAILED", str(e))
            raise

        finally:
            if self.status != DeviceStatus.ERROR:
                self.status = DeviceStatus.IDLE
            self.current_operation = None

    def _generate_and_store_data(self):
        """Generate and store simulated device data"""
        timestamp = datetime.now()
        for data_type, generator in self.data_generators.items():
            value = generator()
            data = DeviceData(
                timestamp=timestamp,
                data_type=data_type,
                value=value,
                unit=self._get_unit_for_data_type(data_type)
            )
            self.data_history.append(data)
            # Keep only last 1000 readings
            if len(self.data_history) > 1000:
                self.data_history.pop(0)

    def _log_error(self, code: str, message: str, details: Optional[Dict] = None):
        """Log a device error"""
        error = DeviceError(
            error_code=code,
            message=message,
            timestamp=datetime.now(),
            details=details
        )
        self.error_history.append(error)
        # Keep only last 100 errors
        if len(self.error_history) > 100:
            self.error_history.pop(0)

    @staticmethod
    def _get_unit_for_data_type(data_type: str) -> Optional[str]:
        """Get the unit for a data type"""
        units = {
            "flow_rate": "mL/min",
            "pressure": "bar",
            "temperature": "°C",
            "humidity": "%",
            "weight": "g",
            "speed": "rpm",
            "torque": "N⋅m"
        }
        return units.get(data_type) 
