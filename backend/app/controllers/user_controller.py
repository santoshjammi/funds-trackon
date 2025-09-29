"""
User Controller - Handles user management endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr
from app.models.user import User, UserRole, EmploymentType
from beanie import PydanticObjectId
from datetime import datetime

user_router = APIRouter(tags=["users"])

# Response models
class UserResponse(BaseModel):
    id: str
    organisation: str
    employment_type: EmploymentType
    name: str
    designation: str
    email: EmailStr
    phone: Optional[str] = None
    notes: Optional[str] = None
    username: Optional[str] = None
    roles: List[UserRole]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

# Request models
class UserCreate(BaseModel):
    organisation: str = "TNIFMC"
    employment_type: EmploymentType
    name: str
    designation: str
    email: EmailStr
    phone: Optional[str] = None
    notes: Optional[str] = None
    username: Optional[str] = None
    password_hash: Optional[str] = None
    roles: List[UserRole] = [UserRole.USER]
    is_active: bool = True

class UserUpdate(BaseModel):
    organisation: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    name: Optional[str] = None
    designation: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    username: Optional[str] = None
    roles: Optional[List[UserRole]] = None
    is_active: Optional[bool] = None

@user_router.get("/", response_model=List[UserResponse])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all users"""
    try:
        users = await User.find_all().skip(skip).limit(limit).to_list()
        return [
            UserResponse(
                id=str(user.id),
                organisation=user.organisation,
                employment_type=user.employment_type,
                name=user.name,
                designation=user.designation,
                email=user.email,
                phone=user.phone,
                notes=user.notes,
                username=user.username,
                roles=user.roles,
                is_active=user.is_active,
                created_at=user.created_at,
                updated_at=user.updated_at,
                last_login=user.last_login
            ) for user in users
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")

@user_router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """Get a specific user"""
    try:
        if not PydanticObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        user = await User.get(PydanticObjectId(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse(
            id=str(user.id),
            organisation=user.organisation,
            employment_type=user.employment_type,
            name=user.name,
            designation=user.designation,
            email=user.email,
            phone=user.phone,
            notes=user.notes,
            username=user.username,
            roles=user.roles,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login=user.last_login
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")

@user_router.put("/{user_id}", response_model=dict)
async def update_user(user_id: str, update_data: UserUpdate):
    """Update a user"""
    try:
        if not PydanticObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        user = await User.get(PydanticObjectId(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        update_dict = update_data.dict(exclude_unset=True)
        if update_dict:
            for field, value in update_dict.items():
                setattr(user, field, value)
            user.updated_at = datetime.utcnow()
            await user.save()
        
        return {"message": "User updated successfully", "id": str(user.id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")

@user_router.delete("/{user_id}", response_model=dict)
async def delete_user(user_id: str):
    """Delete a user"""
    try:
        if not PydanticObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        user = await User.get(PydanticObjectId(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        await user.delete()
        return {"message": "User deleted successfully", "id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")

@user_router.post("/", response_model=dict)
async def create_user(user_data: UserCreate):
    """Create a new user"""
    try:
        user = User(**user_data.dict())
        await user.save()
        return {"message": "User created successfully", "id": str(user.id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")

@user_router.get("/role/{role}", response_model=List[UserResponse])
async def get_users_by_role(role: UserRole):
    """Get users by role"""
    try:
        users = await User.find({"roles": role}).to_list()
        return [
            UserResponse(
                id=str(user.id),
                organisation=user.organisation,
                employment_type=user.employment_type,
                name=user.name,
                designation=user.designation,
                email=user.email,
                phone=user.phone,
                notes=user.notes,
                username=user.username,
                roles=user.roles,
                is_active=user.is_active,
                created_at=user.created_at,
                updated_at=user.updated_at,
                last_login=user.last_login
            ) for user in users
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users by role: {str(e)}")