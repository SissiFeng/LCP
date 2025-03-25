import pytest
import asyncio
from datetime import datetime
from lcp_fake_device.models import (
    DeviceConfig,
    DeviceType,
    DeviceMode,
    OperationRequest,
    OperationType,
    SimulationConfig
)
from lcp_fake_device.device_simulator import DeviceSimulator

@pytest.fixture
def device_config():
    return DeviceConfig(
        device_type=DeviceType.PUMP,
        mode=DeviceMode.NORMAL,
        capabilities=["flow_control", "pressure_monitoring"],
        parameters={
            "max_flow_rate": 10.0,
            "max_pressure": 5.0
        },
        simulation_config=SimulationConfig(
            operation_delay=1.0,
            error_probability=0.1,
            data_update_interval=0.5
        )
    )

@pytest.fixture
def simulator(device_config):
    return DeviceSimulator("test_device_1", device_config)

@pytest.mark.asyncio
async def test_device_initialization(simulator):
    """Test device simulator initialization"""
    assert simulator.device_id == "test_device_1"
    assert simulator.status == "idle"
    assert simulator.current_operation is None
    assert len(simulator.data_history) == 0
    assert len(simulator.error_history) == 0

@pytest.mark.asyncio
async def test_device_specific_behavior(simulator):
    """Test device-specific data generation"""
    simulator._generate_and_store_data()
    assert len(simulator.data_history) == 2  # flow_rate and pressure
    data_types = {data.data_type for data in simulator.data_history}
    assert "flow_rate" in data_types
    assert "pressure" in data_types

@pytest.mark.asyncio
async def test_start_operation(simulator):
    """Test starting an operation"""
    operation = OperationRequest(
        operation_type=OperationType.START,
        parameters={"flow_rate": 5.0}
    )
    response = await simulator.start_operation(operation)
    
    assert response.operation_id is not None
    assert response.status == "started"
    assert isinstance(response.start_time, datetime)
    assert isinstance(response.estimated_completion, datetime)
    assert response.parameters == {"flow_rate": 5.0}

@pytest.mark.asyncio
async def test_operation_execution(simulator):
    """Test operation execution and data generation"""
    operation = OperationRequest(
        operation_type=OperationType.START,
        parameters={"flow_rate": 5.0}
    )
    response = await simulator.start_operation(operation)
    
    # Wait for operation to complete
    await asyncio.sleep(1.5)
    
    assert len(simulator.data_history) > 0
    assert simulator.status == "idle"
    assert simulator.current_operation is None

@pytest.mark.asyncio
async def test_stop_operation(simulator):
    """Test stopping an operation"""
    operation = OperationRequest(
        operation_type=OperationType.START,
        parameters={"flow_rate": 5.0}
    )
    response = await simulator.start_operation(operation)
    
    await simulator.stop_operation(response.operation_id)
    assert simulator.status == "idle"
    assert simulator.current_operation is None

@pytest.mark.asyncio
async def test_error_handling(simulator):
    """Test error handling in unstable mode"""
    # Set to unstable mode
    simulator.config.mode = DeviceMode.UNSTABLE
    simulator.sim_config.error_probability = 1.0  # Force error
    
    operation = OperationRequest(
        operation_type=OperationType.START,
        parameters={"flow_rate": 5.0}
    )
    
    with pytest.raises(Exception):
        await simulator.start_operation(operation)
        await asyncio.sleep(0.5)
    
    assert len(simulator.error_history) > 0
    assert simulator.status == "error"

@pytest.mark.asyncio
async def test_data_history_limit(simulator):
    """Test data history size limit"""
    # Generate more than 1000 data points
    for _ in range(1100):
        simulator._generate_and_store_data()
    
    assert len(simulator.data_history) == 1000  # Maximum size

@pytest.mark.asyncio
async def test_error_history_limit(simulator):
    """Test error history size limit"""
    # Generate more than 100 errors
    for i in range(110):
        simulator._log_error(
            "TEST_ERROR",
            f"Test error {i}",
            {"index": i}
        )
    
    assert len(simulator.error_history) == 100  # Maximum size

@pytest.mark.asyncio
async def test_different_operation_modes(simulator):
    """Test different operation modes"""
    operation = OperationRequest(
        operation_type=OperationType.START,
        parameters={"flow_rate": 5.0}
    )

    # Test fast mode
    simulator.config.mode = DeviceMode.FAST
    response_fast = await simulator.start_operation(operation)
    
    # Test normal mode
    simulator.config.mode = DeviceMode.NORMAL
    response_normal = await simulator.start_operation(operation)
    
    # Fast mode should have shorter estimated completion time
    assert (response_fast.estimated_completion - response_fast.start_time) < \
           (response_normal.estimated_completion - response_normal.start_time) 
