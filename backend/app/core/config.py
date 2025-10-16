from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "EVMS"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://evms_user:password@localhost:5432/evms"
    )
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://admin.venue.local",
        "https://venue.local"
    ]
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30
    WS_HEARTBEAT_TIMEOUT: int = 90
    
    # Session Monitor
    SESSION_CHECK_INTERVAL: int = 10  # seconds
    SESSION_WARNING_MINUTES: int = 5
    SESSION_FINAL_WARNING_MINUTES: int = 1
    
    # Smart Plug Integration
    SHELLY_DEVICES: str = os.getenv("SHELLY_DEVICES", "")
    
    # Router Integration
    MIKROTIK_HOST: str = os.getenv("MIKROTIK_HOST", "")
    MIKROTIK_USER: str = os.getenv("MIKROTIK_USER", "")
    MIKROTIK_PASSWORD: str = os.getenv("MIKROTIK_PASSWORD", "")
    
    # Payment Gateway (optional)
    STRIPE_API_KEY: str = os.getenv("STRIPE_API_KEY", "")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
