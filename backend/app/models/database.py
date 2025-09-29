"""
MongoDB database configuration and connection management
"""

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.utils.config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient = None
    database = None


db = Database()


async def connect_to_mongo():
    """Create database connection"""
    try:
        db.client = AsyncIOMotorClient(settings.mongodb_url)
        db.database = db.client[settings.database_name]
        logger.info(f"Connected to MongoDB at {settings.mongodb_url}")
        
        # Test connection
        await db.client.admin.command('ping')
        logger.info("MongoDB connection successful")
        
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        logger.info("Disconnected from MongoDB")


async def init_db():
    """Initialize database with Beanie ODM"""
    try:
        await connect_to_mongo()
        
        # Import all document models
        from app.models.contact import Contact
        from app.models.fundraising import Fundraising
        from app.models.user import User
        from app.models.opportunity import Opportunity
        from app.models.task import Task
        from app.models.tracker import Tracker
        from app.models.organization import Organization
        
        # Initialize Beanie with document models
        await init_beanie(
            database=db.database,
            document_models=[
                Contact,
                Fundraising,
                User,
                Opportunity,
                Task,
                Tracker,
                Organization
            ]
        )
        
        logger.info("Database initialized successfully with Beanie ODM")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise


def get_database():
    """Get database instance"""
    return db.database