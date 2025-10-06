#!/usr/bin/env python3
"""
Quick Admin User Setup
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the parent directory to Python path to import our modules
sys.path.append(str(Path(__file__).parent.parent))

from app.models.database import init_db, close_mongo_connection
from app.models.user import User, EmploymentType

async def create_admin_user():
    """Create a simple admin user"""
    
    try:
        # Initialize database connection
        await init_db()
        print("✅ Connected to database")
        
        # Check if admin user already exists
        existing_admin = await User.find_one({"username": "admin"})
        
        if existing_admin:
            print("✅ Admin user already exists")
            print(f"   Name: {existing_admin.name}")
            print(f"   Email: {existing_admin.email}")
            print(f"   Username: {existing_admin.username}")
            # Update password if needed
            existing_admin.password_hash = "admin123"
            await existing_admin.save()
            print("✅ Updated admin password")
        else:
            # Create new admin user
            admin_user = User(
                organisation="TNIFMC",
                employment_type=EmploymentType.EMPLOYEE,
                name="Admin User",
                designation="Administrator",
                email="admin@tnifmc.com",
                phone="1234567890",
                username="admin",
                password_hash="admin123",  # Plain text for testing
                is_active=True
            )
            
            await admin_user.insert()
            print("✅ Created new admin user")
        
        print("\n🔑 Login credentials:")
        print("   Username: admin")
        print("   Password: admin123")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(create_admin_user())