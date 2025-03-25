"""
Test cases for the Temperature Controller LCP implementation
"""

import pytest
from unittest.mock import patch
from datetime import datetime

from ..lcp_interface import TemperatureController, ValidationError, HardwareError, DeviceState

@pytest.fixture
def controller():
    """Create a temperature controller instance for testing"""
    controller = TemperatureController("test_device", "COM1")
    controller.connect()
    yield controller
    controller.disconnect()

class TestTemperatureController:
    """Test suite for Temperature Controller implementation"""

    def test_initialization(self, controller):
        """Test controller initialization"""
        assert controller.device_id == "test_device"
        assert controller.port == "COM1"
        assert controller.state == DeviceState.IDLE
        assert controller._current_temperature == 25.0
        assert not controller._heating
        assert not controller._cooling

    def test_connection(self, controller):
        """Test connection handling"""
        # Test successful connection
        assert controller.state == DeviceState.IDLE
        
        # Test disconnection
        assert controller.disconnect()
        assert controller.state == DeviceState.DISCONNECTED
        
        # Test reconnection
        assert controller.connect()
        assert controller.state == DeviceState.IDLE

    def test_start_operation(self, controller):
        """Test starting temperature control operation"""
        # Test valid temperature
        response = controller.start({"target_temperature": 37.0})
        assert "operation_id" in response
        assert response["status"] == "accepted"
        assert controller.state == DeviceState.RUNNING
        assert controller._target_temperature == 37.0
        
        # Test invalid temperature (too high)
        with pytest.raises(ValidationError) as exc_info:
            controller.start({"target_temperature": 100.0})
        assert "outside valid range" in str(exc_info.value)
        
        # Test invalid temperature (too low)
        with pytest.raises(ValidationError) as exc_info:
            controller.start({"target_temperature": 0.0})
        assert "outside valid range" in str(exc_info.value)
        
        # Test missing parameter
        with pytest.raises(ValidationError) as exc_info:
            controller.start({})
        assert "Missing required parameter" in str(exc_info.value)

    def test_stop_operation(self, controller):
        """Test stopping temperature control operation"""
        # Start an operation first
        response = controller.start({"target_temperature": 37.0})
        operation_id = response["operation_id"]
        
        # Test stopping with correct operation ID
        response = controller.stop(operation_id)
        assert response["status"] == "stopped"
        assert controller.state == DeviceState.IDLE
        assert not controller._heating
        assert not controller._cooling
        
        # Test stopping when not running
        with pytest.raises(ValidationError) as exc_info:
            controller.stop(operation_id)
        assert "Cannot stop operation" in str(exc_info.value)
        
        # Test stopping with incorrect operation ID
        controller.start({"target_temperature": 37.0})
        with pytest.raises(ValidationError) as exc_info:
            controller.stop("invalid_id")
        assert "Operation ID mismatch" in str(exc_info.value)

    def test_status_reporting(self, controller):
        """Test status reporting"""
        # Test initial status
        status = controller.status()
        assert status["state"] == "idle"
        assert "current_temperature" in status["parameters"]
        assert "target_temperature" in status["parameters"]
        assert "heating" in status["parameters"]
        assert "cooling" in status["parameters"]
        
        # Test status during operation
        controller.start({"target_temperature": 37.0})
        status = controller.status()
        assert status["state"] == "running"
        assert status["parameters"]["target_temperature"] == 37.0
        assert isinstance(status["parameters"]["heating"], bool)
        assert isinstance(status["parameters"]["cooling"], bool)

    def test_reset(self, controller):
        """Test reset functionality"""
        # Start an operation
        controller.start({"target_temperature": 37.0})
        
        # Test reset
        response = controller.reset()
        assert response["status"] == "reset_complete"
        assert controller.state == DeviceState.IDLE
        assert controller._target_temperature == 25.0
        assert not controller._heating
        assert not controller._cooling

    def test_temperature_control(self, controller):
        """Test temperature control behavior"""
        # Test heating
        controller.start({"target_temperature": 30.0})
        controller._current_temperature = 25.0
        controller._update_heating_cooling_status()
        assert controller._heating
        assert not controller._cooling
        
        # Test cooling
        controller.start({"target_temperature": 20.0})
        controller._current_temperature = 25.0
        controller._update_heating_cooling_status()
        assert not controller._heating
        assert controller._cooling
        
        # Test stable temperature
        controller.start({"target_temperature": 25.0})
        controller._current_temperature = 25.0
        controller._update_heating_cooling_status()
        assert not controller._heating
        assert not controller._cooling

    def test_error_handling(self, controller):
        """Test error handling"""
        # Simulate hardware error
        with pytest.raises(HardwareError) as exc_info:
            controller._current_temperature = -999  # Invalid temperature
            controller.status()  # This should trigger an error
        
        # Check error state
        assert controller.state == DeviceState.ERROR
        assert controller._last_error is not None
        assert controller._last_error["category"] == "hardware_error"

    def test_temperature_simulation(self, controller):
        """Test temperature simulation"""
        # Start heating
        controller.start({"target_temperature": 30.0})
        initial_temp = controller._current_temperature
        
        # Simulate temperature change
        controller._simulate_temperature_change()
        
        # Temperature should increase when heating
        if controller._heating:
            assert controller._current_temperature > initial_temp
        
        # Temperature should stay within bounds
        assert controller.min_temp <= controller._current_temperature <= controller.max_temp 
