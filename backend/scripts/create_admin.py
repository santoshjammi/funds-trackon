#!/usr/bin/env python3
"""
Create default admin user for the Lead Management System
"""

import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to Python path
sys.path.append(str(Path(__file__).parent))

# Add parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.models.database import init_db, close_mongo_connection
from app.models.user import User, EmploymentType
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin_user():
    """Create default admin user"""
    print("Creating default admin user...")

    try:
        await init_db()

        # Check if admin user already exists
        existing_admin = await User.find_one({"email": "admin@tnifmc.com"})
        if existing_admin:
            print("Admin user already exists!")
            return

        # For testing, use plain text password (as supported by auth controller)
        password_hash = "admin123"

        # Create admin user
        admin_user = User(
            organisation="TNIFMC",
            employment_type=EmploymentType.EMPLOYEE,
            name="System Administrator",
            designation="Administrator",
            email="admin@tnifmc.com",
            phone=None,
            notes="Default system administrator account",
            username="admin",
            password_hash=password_hash,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        await admin_user.insert()
        print("✅ Default admin user created successfully!")
        print("   Email: admin@tnifmc.com")
        print("   Username: admin")
        print("   Password: admin123")

    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(create_admin_user())