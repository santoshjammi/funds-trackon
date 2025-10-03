"""
Configuration settings for the Lead Management System
"""

from pydantic_settings import BaseSettings
from typing import Optional, List
from pydantic import field_validator
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # MongoDB settings
    mongodb_url: str = "mongodb://localhost:27019"
    database_name: str = "trackon_lead_management"
    
    # Port settings
    frontend_port: int = 3000
    backend_port: int = 8000
    mongo_port: int = 27019
    
    # JWT settings
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS settings
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3002",
        "http://127.0.0.1:3002"
    ]
    
    # OpenAI settings
    openai_api_key: Optional[str] = None
    
    # Environment
    environment: str = "development"
    node_env: str = "development"
    debug: bool = True

    # Compatibility toggles for schema migration (tnifmc_* → niveshya_*)
    write_compat_tnifmc_fields: bool = True  # When True, write both legacy and new fields
    response_include_both_field_names: bool = True  # When True, include both names in API responses
    
    class Config:
        env_file = ".env"

    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_env(cls, v):
        # Accept list, JSON string, or comma-separated values
        if v is None:
            return v
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            s = v.strip()
            # Try JSON first
            try:
                import json
                parsed = json.loads(s)
                if isinstance(parsed, list) and all(isinstance(i, str) for i in parsed):
                    return parsed
            except Exception:
                pass
            # Fallback: CSV string
            return [i.strip() for i in s.split(',') if i.strip()]
        return v


def get_settings() -> Settings:
    """Get application settings"""
    return Settings()