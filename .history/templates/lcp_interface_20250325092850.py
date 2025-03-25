"""
LCP Interface Template
This template demonstrates how to implement the LCP interface for a device.
"""

import abc
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from enum import Enum

class DeviceState(Enum):
    """Standard device states"""
    IDLE = "idle"
    RUNNING = "running"
    ERROR = "error"
    MAINTENANCE = "maintenance"
    CALIBRATING = "calibrating"
    DISCONNECTED = "disconnected"

class LCPError(Exception):
    """Base exception for LCP errors"""
    def __init__(self, message: str, error_code: str, category: str):
        self.message = message
        self.error_code = error_code
        self.category = category
        super().__init__(self.message)

class ValidationError(LCPError):
    """Raised when command parameters are invalid"""
    def __init__(self, message: str):
        super().__init__(message, "E101", "validation_error")

class HardwareError(LCPError):
    """Raised when device hardware encounters an error"""
    def __init__(self, message: str):
        super().__init__(message, "E001", "hardware_error")

class LCPInterface(abc.ABC):
    """
    Abstract base class for LCP device interfaces.
    All device implementations must inherit from this class.
    """

    def __init__(self):
        """Initialize the device interface"""
        self.logger = logging.getLogger(self.__class__.__name__)
        self._state = DeviceState.DISCONNECTED
        self._last_error = None
        self._current_operation = None

    @property
    def state(self) -> DeviceState:
        """Get the current device state"""
        return self._state

    @abc.abstractmethod
    def connect(self) -> bool:
        """
        Establish connection with the device
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        pass

    @abc.abstractmethod
    def disconnect(self) -> bool:
        """
        Disconnect from the device
        
        Returns:
            bool: True if disconnection successful, False otherwise
        """
        pass

    def start(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Start device operation
        
        Args:
            parameters: Operation parameters
            
        Returns:
            Dict containing operation ID and status
        """
        if self._state != DeviceState.IDLE:
            raise ValidationError(f"Cannot start operation in {self._state.value} state")
        
        self._validate_start_parameters(parameters)
        operation_id = self._generate_operation_id()
        
        try:
            self._start_implementation(parameters)
            self._state = DeviceState.RUNNING
            self._current_operation = operation_id
            
            return {
                "operation_id": operation_id,
                "status": "accepted",
                "timestamp": self._get_timestamp()
            }
        except Exception as e:
            self._handle_error(e)
            raise

    def stop(self, operation_id: str) -> Dict[str, Any]:
        """
        Stop current operation
        
        Args:
            operation_id: ID of operation to stop
            
        Returns:
            Dict containing stop confirmation
        """
        if self._state != DeviceState.RUNNING:
            raise ValidationError(f"Cannot stop operation in {self._state.value} state")
        
        if operation_id != self._current_operation:
            raise ValidationError(f"Operation ID mismatch")
        
        try:
            self._stop_implementation()
            self._state = DeviceState.IDLE
            self._current_operation = None
            
            return {
                "status": "stopped",
                "timestamp": self._get_timestamp()
            }
        except Exception as e:
            self._handle_error(e)
            raise

    def status(self) -> Dict[str, Any]:
        """
        Get device status
        
        Returns:
            Dict containing current device status
        """
        try:
            parameters = self._get_status_parameters()
            return {
                "state": self._state.value,
                "parameters": parameters,
                "timestamp": self._get_timestamp(),
                "errors": [self._last_error] if self._last_error else []
            }
        except Exception as e:
            self._handle_error(e)
            raise

    def reset(self) -> Dict[str, Any]:
        """
        Reset device to initial state
        
        Returns:
            Dict containing reset confirmation
        """
        try:
            self._reset_implementation()
            self._state = DeviceState.IDLE
            self._current_operation = None
            self._last_error = None
            
            return {
                "status": "reset_complete",
                "timestamp": self._get_timestamp()
            }
        except Exception as e:
            self._handle_error(e)
            raise

    @abc.abstractmethod
    def _start_implementation(self, parameters: Dict[str, Any]):
        """Implement device-specific start operation"""
        pass

    @abc.abstractmethod
    def _stop_implementation(self):
        """Implement device-specific stop operation"""
        pass

    @abc.abstractmethod
    def _reset_implementation(self):
        """Implement device-specific reset operation"""
        pass

    @abc.abstractmethod
    def _get_status_parameters(self) -> Dict[str, Any]:
        """
        Get device-specific status parameters
        
        Returns:
            Dict containing current parameter values
        """
        pass

    def _validate_start_parameters(self, parameters: Dict[str, Any]):
        """
        Validate parameters for start operation
        
        Args:
            parameters: Parameters to validate
            
        Raises:
            ValidationError: If parameters are invalid
        """
        required_params = self._get_required_start_parameters()
        for param in required_params:
            if param not in parameters:
                raise ValidationError(f"Missing required parameter: {param}")

    @abc.abstractmethod
    def _get_required_start_parameters(self) -> List[str]:
        """
        Get list of required parameters for start operation
        
        Returns:
            List of parameter names
        """
        pass

    def _generate_operation_id(self) -> str:
        """Generate unique operation ID"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return f"op_{timestamp}"

    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        return datetime.utcnow().isoformat() + "Z"

    def _handle_error(self, error: Exception):
        """Handle and log device errors"""
        self._state = DeviceState.ERROR
        if isinstance(error, LCPError):
            self._last_error = {
                "code": error.error_code,
                "category": error.category,
                "message": str(error),
                "timestamp": self._get_timestamp()
            }
        else:
            self._last_error = {
                "code": "E999",
                "category": "system_error",
                "message": str(error),
                "timestamp": self._get_timestamp()
            }
        self.logger.error(f"Device error: {error}", exc_info=True) 
