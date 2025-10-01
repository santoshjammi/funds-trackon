#!/usr/bin/env python3
"""
Create Test Admin User
Simple script to create an admin user for testing the dashboard
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the parent directory to Python path to import our modules
sys.path.append(str(Path(__file__).parent.parent))

from app.models.database import init_db, close_mongo_connection
from app.models.user import User

async def create_admin():
    """Create admin user for testing"""
    
    try:
        # Initialize database connection
        await init_db()
        print("✅ Connected to database")
        
        # Check if admin user already exists
        existing_admin = await User.find_one({"username": "admin"})
        if existing_admin:
            print("⚠️  Admin user already exists. Deleting and recreating...")
            await existing_admin.delete()
        
        # Create admin user with plain text password (matching auth controller)
        admin_user = User(
            organisation="Niveshya",
            employment_type="Employee",
            name="Admin User",
            designation="Administrator",
            email="admin@niveshya.com",
            username="admin",
            password_hash="admin123",  # Plain text - auth controller compares directly
            roles=["admin", "manager"],
            is_active=True
        )
        
        await admin_user.insert()
        print("✅ Created admin user successfully")
        
        print("\n🎉 Setup complete! You can now login with:")
        print("=" * 60)
        print("  Username: admin")
        print("  Password: admin123")
        print("=" * 60)
        
        # Verify the user was created
        verify_user = await User.find_one({"username": "admin"})
        if verify_user:
            print(f"\n✅ Verified user created:")
            print(f"   ID: {verify_user.id}")
            print(f"   Name: {verify_user.name}")
            print(f"   Email: {verify_user.email}")
            print(f"   Username: {verify_user.username}")
            print(f"   Roles: {verify_user.roles}")
            print(f"   Active: {verify_user.is_active}")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(create_admin())
