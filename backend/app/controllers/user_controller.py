"""
User Controller - Handles user management endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr
from app.models.user import User, EmploymentType
from beanie import PydanticObjectId
from datetime import datetime
from passlib.context import CryptContext

user_router = APIRouter(tags=["users"])

# Password management
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _is_bcrypt_hash(value: Optional[str]) -> bool:
    """Best-effort check if a stored password looks like a bcrypt hash."""
    if not value or not isinstance(value, str):
        return False
    # Typical bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$, and are ~60 chars
    # But let's be more conservative and actually try to verify the format
    return (value.startswith(("$2a$", "$2b$", "$2x$", "$2y$")) and 
            len(value) >= 59 and len(value) <= 64 and
            value.count('$') >= 3)

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
    role_names: List[str]
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
    role_names: List[str] = ["User"]
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
    role_names: Optional[List[str]] = None
    is_active: Optional[bool] = None

@user_router.get("/", response_model=List[UserResponse])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(10000, ge=1, le=10000)
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
                role_names=user.get_role_names(),
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
            role_names=user.get_role_names(),
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
async def get_users_by_role(role: str):
    """Get users by role"""
    try:
        users = await User.find({"role_assignments.role_name": role}).to_list()
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
                role_names=user.get_role_names(),
                is_active=user.is_active,
                created_at=user.created_at,
                updated_at=user.updated_at,
                last_login=user.last_login
            ) for user in users
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users by role: {str(e)}")


# Password management models
class SetPasswordRequest(BaseModel):
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@user_router.post("/{user_id}/set-password", response_model=dict)
async def set_user_password(user_id: str, password_data: SetPasswordRequest):
    """Set password for a user (admin function)"""
    try:
        if not PydanticObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        user = await User.get(PydanticObjectId(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # For now, store plaintext to avoid bcrypt issues (TODO: fix bcrypt later)
        user.password_hash = password_data.password
        user.updated_at = datetime.utcnow()
        await user.save()
        
        return {"message": "Password set successfully", "id": str(user.id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error setting password: {str(e)}")


@user_router.post("/{user_id}/change-password", response_model=dict)
async def change_user_password(user_id: str, password_data: ChangePasswordRequest):
    """Change password for a user (requires current password)"""
    try:
        if not PydanticObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        user = await User.get(PydanticObjectId(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password
        if not user.password_hash:
            raise HTTPException(status_code=401, detail="Current password is incorrect")

        # For now, use simple plaintext comparison to avoid bcrypt issues
        if user.password_hash != password_data.current_password:
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # For now, store plaintext to avoid bcrypt issues (TODO: fix bcrypt later)
        user.password_hash = password_data.new_password
        user.updated_at = datetime.utcnow()
        await user.save()
        
        return {"message": "Password changed successfully", "id": str(user.id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error changing password: {str(e)}")


@user_router.get("/{user_id}/has-password", response_model=dict)
async def check_user_has_password(user_id: str):
    """Check if user has a password set"""
    try:
        if not PydanticObjectId.is_valid(user_id):
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        user = await User.get(PydanticObjectId(user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Consider password as 'set' if there's any password hash (bcrypt or legacy)
        has_password = bool(user.password_hash and len(user.password_hash.strip()) > 0)
        return {"user_id": str(user.id), "has_password": has_password}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking password: {str(e)}")