from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Optional
import uvicorn
import logging
from .models import (
    DeviceConfig,
    DeviceStatus,
    OperationRequest,
    OperationResponse,
    DeviceResponse
)
from .device_simulator import DeviceSimulator
from .config import Settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="LCP Fake Device Farm",
    description="A mock LCP server for testing and development",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store device simulators
device_simulators: Dict[str, DeviceSimulator] = {}

@app.post("/devices", response_model=DeviceResponse)
async def create_device(config: DeviceConfig):
    """Create a new simulated device"""
    device_id = f"{config.device_type}_{len(device_simulators) + 1}"
    simulator = DeviceSimulator(device_id, config)
    device_simulators[device_id] = simulator
    return DeviceResponse(
        device_id=device_id,
        status="created",
        config=config
    )

@app.get("/devices/{device_id}/status", response_model=DeviceStatus)
async def get_device_status(device_id: str):
    """Get the current status of a device"""
    simulator = device_simulators.get(device_id)
    if not simulator:
        raise HTTPException(status_code=404, detail="Device not found")
    return simulator.get_status()

@app.post("/devices/{device_id}/operations", response_model=OperationResponse)
async def start_operation(device_id: str, operation: OperationRequest):
    """Start a new operation on the device"""
    simulator = device_simulators.get(device_id)
    if not simulator:
        raise HTTPException(status_code=404, detail="Device not found")
    return await simulator.start_operation(operation)

@app.delete("/devices/{device_id}/operations/{operation_id}")
async def stop_operation(device_id: str, operation_id: str):
    """Stop an ongoing operation"""
    simulator = device_simulators.get(device_id)
    if not simulator:
        raise HTTPException(status_code=404, detail="Device not found")
    await simulator.stop_operation(operation_id)
    return {"status": "stopped"}

@app.get("/devices")
async def list_devices():
    """List all simulated devices"""
    return {
        device_id: simulator.get_status()
        for device_id, simulator in device_simulators.items()
    }

@app.delete("/devices/{device_id}")
async def delete_device(device_id: str):
    """Remove a simulated device"""
    if device_id not in device_simulators:
        raise HTTPException(status_code=404, detail="Device not found")
    del device_simulators[device_id]
    return {"status": "deleted"}

@app.get("/health")
async def health_check():
    """Health check endpoint for Docker"""
    return {"status": "healthy"}

def start():
    """Entry point for the application."""
    settings = Settings()
    uvicorn.run(
        "lcp_fake_device.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )

if __name__ == "__main__":
    start() 
