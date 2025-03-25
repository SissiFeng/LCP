from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings"""
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    log_level: str = "INFO"

    # Default simulation settings
    default_operation_delay: float = 2.0
    default_error_probability: float = 0.1
    default_data_update_interval: float = 1.0

    class Config:
        env_prefix = "LCP_FAKE_"
        case_sensitive = False 
