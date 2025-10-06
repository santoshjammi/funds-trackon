#!/usr/bin/env python3
"""
Setup Admin User Script
Creates an admin user with login credentials for the TNIFMC Lead Management System
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the parent directory to Python path to import our modules
sys.path.append(str(Path(__file__).parent.parent))

from app.models.database import init_db, close_mongo_connection
from app.models.user import User, EmploymentType
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def setup_admin_user():
    """Setup an admin user for the system"""
    
    try:
        # Initialize database connection
        await init_db()
        print("✅ Connected to database")
        
        # Check if admin user already exists
        admin_email = "krishna.chaitanya@tnifmc.com"
        existing_admin = await User.find_one({"email": admin_email})
        
        if existing_admin:
            print(f"✅ Admin user already exists: {existing_admin.email}")
            print(f"   Name: {existing_admin.name}")
            print(f"   Username: {existing_admin.username}")
            print(f"   Has Password: {'Yes' if existing_admin.password_hash else 'No'}")
            print(f"   Roles: {existing_admin.get_role_names()}")
            
            # Update if missing username or password
            needs_update = False
            if not existing_admin.username:
                existing_admin.username = "admin"
                needs_update = True
            # Always update password to ensure it's correct
            password = "admin123"  # Default password
            existing_admin.password_hash = pwd_context.hash(password)
            needs_update = True
            if not existing_admin.has_role("admin"):
                existing_admin.add_role("admin", "admin")
                needs_update = True
            if not existing_admin.has_role("manager"):
                existing_admin.add_role("manager", "manager")
                needs_update = True
                
            if needs_update:
                await existing_admin.save()
                print(f"✅ Updated admin user")
                print(f"   Username: admin")
                print(f"   Password: admin123")
        else:
            # Create new admin user
            admin_user = User(
                organisation="TNIFMC",
                employment_type=EmploymentType.EMPLOYEE,
                name="Krishna Chaitanya K",
                designation="CEO",
                email=admin_email,
                phone="99674 00111",
                username="admin",
                password_hash=pwd_context.hash("admin123"),
                is_active=True
            )
            
            # Add admin and manager roles
            admin_user.add_role("admin", "admin")
            admin_user.add_role("manager", "manager")
            
            await admin_user.insert()
            print("✅ Created new admin user:")
            print(f"   Name: {admin_user.name}")
            print(f"   Email: {admin_user.email}")
            print(f"   Username: admin")
            print(f"   Password: admin123")
            print(f"   Roles: {admin_user.roles}")
        
        # Also check/create a few other users with passwords for testing
        test_users = [
            {
                "name": "K. Ganapathy Subramanian",
                "email": "gana.sk@tnifmc.com",
                "username": "gana.sk",
                "designation": "Head - Operations & Partnerships",
                "role_name": "manager"
            },
            {
                "name": "Karthic Ramamoorthy", 
                "email": "karthic.r@tnifmc.com",
                "username": "karthic.r",
                "designation": "Investment Analyst",
                "role_name": "analyst"
            }
        ]
        
        for user_data in test_users:
            existing_user = await User.find_one({"email": user_data["email"]})
            if existing_user:
                # Update if no password
                if not existing_user.password_hash:
                    existing_user.password_hash = pwd_context.hash("password123")
                    existing_user.username = user_data["username"]
                    existing_user.add_role(user_data["role_name"], user_data["role_name"])
                    await existing_user.save()
                    print(f"✅ Updated user: {user_data['username']} / password123")
            else:
                # Create new user
                new_user = User(
                    organisation="TNIFMC",
                    employment_type=EmploymentType.EMPLOYEE,
                    name=user_data["name"],
                    designation=user_data["designation"],
                    email=user_data["email"],
                    username=user_data["username"],
                    password_hash=pwd_context.hash("password123"),
                    is_active=True
                )
                new_user.add_role(user_data["role_name"], user_data["role_name"])
                await new_user.insert()
                print(f"✅ Created user: {user_data['username']} / password123")
        
        print("\n🎉 Setup complete! You can now login with:")
        print("=" * 50)
        print("ADMIN USER:")
        print("  Username: admin")
        print("  Password: admin123")
        print("  Roles: Admin, Manager")
        print()
        print("TEST USERS:")
        print("  Username: gana.sk / Password: password123 (Manager)")
        print("  Username: karthic.r / Password: password123 (Analyst)")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error setting up admin user: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(setup_admin_user())