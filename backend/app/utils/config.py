"""
Configuration settings for the Lead Management System
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # MongoDB settings
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "trackon_lead_management"
    
    # JWT settings
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS settings
    cors_origins: list = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"]
    
    # Environment
    environment: str = "development"
    debug: bool = True
    
    class Config:
        env_file = ".env"


def get_settings() -> Settings:
    """Get application settings"""
    return Settings()