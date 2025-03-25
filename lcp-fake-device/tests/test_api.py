import pytest
from fastapi.testclient import TestClient
from lcp_fake_device.main import app
from lcp_fake_device.models import DeviceType, DeviceMode

client = TestClient(app)

def test_create_device():
    """Test device creation endpoint"""
    device_config = {
        "device_type": DeviceType.PUMP,
        "mode": DeviceMode.NORMAL,
        "capabilities": ["flow_control", "pressure_monitoring"],
        "parameters": {
            "max_flow_rate": 10.0,
            "max_pressure": 5.0
        }
    }
    
    response = client.post("/devices", json=device_config)
    assert response.status_code == 200
    data = response.json()
    assert "device_id" in data
    assert data["status"] == "created"
    assert data["config"]["device_type"] == DeviceType.PUMP

def test_list_devices():
    """Test listing devices endpoint"""
    # Create a device first
    device_config = {
        "device_type": DeviceType.TEMPERATURE_CONTROLLER,
        "mode": DeviceMode.NORMAL
    }
    client.post("/devices", json=device_config)
    
    response = client.get("/devices")
    assert response.status_code == 200
    devices = response.json()
    assert len(devices) > 0

def test_get_device_status():
    """Test getting device status endpoint"""
    # Create a device first
    device_config = {
        "device_type": DeviceType.BALANCE,
        "mode": DeviceMode.NORMAL
    }
    create_response = client.post("/devices", json=device_config)
    device_id = create_response.json()["device_id"]
    
    response = client.get(f"/devices/{device_id}/status")
    assert response.status_code == 200
    status = response.json()
    assert status["device_id"] == device_id
    assert "status" in status
    assert "last_update" in status

def test_start_operation():
    """Test starting an operation endpoint"""
    # Create a device first
    device_config = {
        "device_type": DeviceType.PUMP,
        "mode": DeviceMode.NORMAL
    }
    create_response = client.post("/devices", json=device_config)
    device_id = create_response.json()["device_id"]
    
    operation = {
        "operation_type": "START",
        "parameters": {
            "flow_rate": 5.0
        }
    }
    response = client.post(f"/devices/{device_id}/operations", json=operation)
    assert response.status_code == 200
    data = response.json()
    assert "operation_id" in data
    assert data["status"] == "started"
    assert "start_time" in data
    assert "estimated_completion" in data

def test_stop_operation():
    """Test stopping an operation endpoint"""
    # Create a device and start an operation first
    device_config = {
        "device_type": DeviceType.PUMP,
        "mode": DeviceMode.NORMAL
    }
    create_response = client.post("/devices", json=device_config)
    device_id = create_response.json()["device_id"]
    
    operation = {
        "operation_type": "START",
        "parameters": {
            "flow_rate": 5.0
        }
    }
    start_response = client.post(f"/devices/{device_id}/operations", json=operation)
    operation_id = start_response.json()["operation_id"]
    
    response = client.delete(f"/devices/{device_id}/operations/{operation_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "stopped"

def test_delete_device():
    """Test deleting a device endpoint"""
    # Create a device first
    device_config = {
        "device_type": DeviceType.STIRRER,
        "mode": DeviceMode.NORMAL
    }
    create_response = client.post("/devices", json=device_config)
    device_id = create_response.json()["device_id"]
    
    response = client.delete(f"/devices/{device_id}")
    assert response.status_code == 200
    assert response.json()["status"] == "deleted"
    
    # Verify device is deleted
    get_response = client.get(f"/devices/{device_id}/status")
    assert get_response.status_code == 404

def test_invalid_device_id():
    """Test handling of invalid device ID"""
    response = client.get("/devices/invalid_id/status")
    assert response.status_code == 404

def test_invalid_operation():
    """Test handling of invalid operation request"""
    # Create a device first
    device_config = {
        "device_type": DeviceType.PUMP,
        "mode": DeviceMode.NORMAL
    }
    create_response = client.post("/devices", json=device_config)
    device_id = create_response.json()["device_id"]
    
    # Try to start operation with invalid parameters
    operation = {
        "operation_type": "INVALID_OPERATION",
        "parameters": {}
    }
    response = client.post(f"/devices/{device_id}/operations", json=operation)
    assert response.status_code == 422  # Validation error

def test_device_modes():
    """Test different device modes"""
    # Test fast mode
    fast_config = {
        "device_type": DeviceType.PUMP,
        "mode": DeviceMode.FAST
    }
    response = client.post("/devices", json=fast_config)
    assert response.status_code == 200
    assert response.json()["config"]["mode"] == DeviceMode.FAST
    
    # Test unstable mode
    unstable_config = {
        "device_type": DeviceType.PUMP,
        "mode": DeviceMode.UNSTABLE
    }
    response = client.post("/devices", json=unstable_config)
    assert response.status_code == 200
    assert response.json()["config"]["mode"] == DeviceMode.UNSTABLE 
