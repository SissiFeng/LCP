"""
Temperature Controller LCP Implementation
A sample implementation of a temperature controller device using the LCP interface.
"""

import time
import random
from typing import Dict, Any, List
from datetime import datetime

from lcp_interface import LCPInterface, ValidationError, HardwareError

class TemperatureController(LCPInterface):
    """
    A simple temperature controller implementation.
    This is a sample device that demonstrates how to implement the LCP interface.
    """

    def __init__(self, device_id: str, port: str = "COM1"):
        """
        Initialize the temperature controller
        
        Args:
            device_id: Unique identifier for this device
            port: Serial port for device communication
        """
        super().__init__()
        self.device_id = device_id
        self.port = port
        self._target_temperature = 25.0
        self._current_temperature = 25.0
        self._heating = False
        self._cooling = False
        
        # Device specifications
        self.min_temp = 4.0
        self.max_temp = 95.0
        self.temp_resolution = 0.1
        self.heating_rate = 1.0  # °C per second
        self.cooling_rate = 0.5  # °C per second

    def connect(self) -> bool:
        """Establish connection with the device"""
        try:
            # Simulate connection setup
            self.logger.info(f"Connecting to temperature controller on port {self.port}")
            time.sleep(1)  # Simulate connection time
            self._state = DeviceState.IDLE
            return True
        except Exception as e:
            self.logger.error(f"Failed to connect: {str(e)}")
            return False

    def disconnect(self) -> bool:
        """Disconnect from the device"""
        try:
            # Simulate disconnection
            self.logger.info("Disconnecting from temperature controller")
            self._state = DeviceState.DISCONNECTED
            return True
        except Exception as e:
            self.logger.error(f"Failed to disconnect: {str(e)}")
            return False

    def _start_implementation(self, parameters: Dict[str, Any]):
        """
        Start temperature control operation
        
        Args:
            parameters: Must contain 'target_temperature'
        """
        target_temp = float(parameters['target_temperature'])
        
        # Validate temperature range
        if not (self.min_temp <= target_temp <= self.max_temp):
            raise ValidationError(
                f"Target temperature {target_temp}°C is outside valid range "
                f"({self.min_temp}°C - {self.max_temp}°C)"
            )
        
        self._target_temperature = target_temp
        self._update_heating_cooling_status()
        
        # Start temperature control in a separate thread (simulated here)
        self.logger.info(f"Starting temperature control to {target_temp}°C")

    def _stop_implementation(self):
        """Stop temperature control operation"""
        self._heating = False
        self._cooling = False
        self.logger.info("Stopping temperature control")

    def _reset_implementation(self):
        """Reset device to default state"""
        self._target_temperature = 25.0
        self._heating = False
        self._cooling = False
        self.logger.info("Reset complete")

    def _get_status_parameters(self) -> Dict[str, Any]:
        """Get current device status parameters"""
        # Simulate temperature changes
        self._simulate_temperature_change()
        
        return {
            "current_temperature": round(self._current_temperature, 1),
            "target_temperature": round(self._target_temperature, 1),
            "heating": self._heating,
            "cooling": self._cooling,
            "min_temperature": self.min_temp,
            "max_temperature": self.max_temp
        }

    def _get_required_start_parameters(self) -> List[str]:
        """Get required parameters for start operation"""
        return ["target_temperature"]

    def _update_heating_cooling_status(self):
        """Update heating/cooling status based on current and target temperatures"""
        temp_diff = self._target_temperature - self._current_temperature
        if abs(temp_diff) < self.temp_resolution:
            self._heating = False
            self._cooling = False
        else:
            self._heating = temp_diff > 0
            self._cooling = temp_diff < 0

    def _simulate_temperature_change(self):
        """Simulate temperature changes based on heating/cooling status"""
        if self._state != DeviceState.RUNNING:
            return
            
        if self._heating:
            self._current_temperature += self.heating_rate * 0.1  # Simulate 100ms of heating
        elif self._cooling:
            self._current_temperature -= self.cooling_rate * 0.1  # Simulate 100ms of cooling
            
        # Add some random fluctuation
        self._current_temperature += random.uniform(-0.1, 0.1)
        
        # Ensure temperature stays within bounds
        self._current_temperature = max(self.min_temp, min(self.max_temp, self._current_temperature))
        
        # Update heating/cooling status
        self._update_heating_cooling_status() 
