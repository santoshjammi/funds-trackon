"""
Simplified FastAPI main application for testing
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.models.database import init_db, close_mongo_connection
from app.controllers.contact_controller import contact_router
from app.controllers.fundraising_controller import fundraising_router
from app.controllers.user_controller import user_router
from app.utils.config import get_settings

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    try:
        # Startup
        await init_db()
        yield
    finally:
        # Shutdown
        await close_mongo_connection()

app = FastAPI(
    title="TNIFMC Lead Management System",
    description="Investment tracking and lead management system",
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
app.include_router(contact_router, prefix="/api/contacts", tags=["contacts"])
app.include_router(fundraising_router, prefix="/api/fundraising", tags=["fundraising"])
app.include_router(user_router, prefix="/api/users", tags=["users"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "TNIFMC Lead Management System API", 
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
        "database": "MongoDB"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )