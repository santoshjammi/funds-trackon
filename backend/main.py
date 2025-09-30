"""
Lead Management System - Main Application Entry Point
FastAPI application with SOLID principles and MongoDB
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.controllers.auth_controller import auth_router
from app.controllers.contact_controller import contact_router
from app.controllers.fundraising_controller import fundraising_router
from app.controllers.user_controller import user_router
from app.controllers.opportunity_controller import opportunity_router
from app.controllers.task_controller import task_router
from app.controllers.tracker_controller import tracker_router
from app.controllers.organization_controller import organization_router
from app.controllers.meeting_controller import meeting_router
from app.models.database import init_db, close_mongo_connection
from app.utils.config import get_settings

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(
    title="Niveshya Lead Management System",
    description="Investment tracking and lead management system with SOLID principles and MongoDB",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
app.include_router(contact_router, prefix="/api/contacts", tags=["contacts"])
app.include_router(organization_router, prefix="/api/organizations", tags=["organizations"])
app.include_router(fundraising_router, prefix="/api/fundraising", tags=["fundraising"])
app.include_router(user_router, prefix="/api/users", tags=["users"])
app.include_router(opportunity_router, prefix="/api/opportunities", tags=["opportunities"])
app.include_router(task_router, prefix="/api/tasks", tags=["tasks"])
app.include_router(tracker_router, prefix="/api/tracker", tags=["tracker"])
app.include_router(meeting_router, prefix="/api/meetings", tags=["meetings"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Niveshya Lead Management System API", 
        "status": "healthy",
        "database": "MongoDB",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "Lead Management System",
        "database": "MongoDB",
        "environment": settings.environment
    }

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Use port from environment or default to 8000
    port = int(os.getenv("PORT", 8001))  # Default to 8001 to match frontend proxy
    
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True,
        log_level="info"
    )