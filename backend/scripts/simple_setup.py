#!/usr/bin/env python3
"""
Simple User Setup Script
Creates admin user without complex password hashing
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the parent directory to Python path to import our modules
sys.path.append(str(Path(__file__).parent.parent))

from app.models.database import init_db, close_mongo_connection
from app.models.user import User, UserRole, EmploymentType
import hashlib

def simple_hash(password: str) -> str:
    """Simple hash for testing - NOT FOR PRODUCTION"""
    return hashlib.sha256(password.encode()).hexdigest()

async def setup_simple_admin():
    """Setup admin user with simple password"""
    
    try:
        # Initialize database connection
        await init_db()
        print("✅ Connected to database")
        
        # Clear all users and start fresh
        await User.delete_all()
        print("✅ Cleared existing users")
        
        # Create Krishna Chaitanya as admin user
        admin_user = User(
            organisation="TNIFMC",
            employment_type=EmploymentType.EMPLOYEE,
            name="Krishna Chaitanya K",
            designation="CEO",
            email="krishna.chaitanya@tnifmc.com",
            username="krishna.chaitanya",
            password_hash="password123",  # Plain text for now - will fix later
            roles=[UserRole.ADMIN, UserRole.MANAGER],
            is_active=True
        )
        
        await admin_user.insert()
        print("✅ Created Krishna Chaitanya as admin user")
        
        # Create test user
        test_user = User(
            organisation="TNIFMC",
            employment_type=EmploymentType.EMPLOYEE,
            name="Test User",
            designation="Analyst",
            email="test@tnifmc.com",
            username="test",
            password_hash="test123",  # Plain text for now
            roles=[UserRole.USER],
            is_active=True
        )
        
        await test_user.insert()
        print("✅ Created test user")
        
        print("\n🎉 Simple setup complete! You can now login with:")
        print("=" * 50)
        print("ADMIN USER:")
        print("  Username: admin")
        print("  Email: admin@tnifmc.com")
        print("  Password: admin123")
        print()
        print("TEST USER:")
        print("  Username: test")
        print("  Email: test@tnifmc.com") 
        print("  Password: test123")
        print("=" * 50)
        print("\nNOTE: Using plain text passwords for testing.")
        print("Will implement proper hashing once login works.")
        
    except Exception as e:
        print(f"❌ Error setting up users: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(setup_simple_admin())