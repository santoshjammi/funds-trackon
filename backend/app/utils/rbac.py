"""
RBAC Decorators and Middleware for Permission Checking
"""

from functools import wraps
from typing import List, Optional, Callable, Any
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from datetime import datetime

from app.models.user import User
from app.models.role import Role, PermissionType
from app.utils.config import get_settings

settings = get_settings()
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user from JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        user_email = payload.get("sub")
        
        if not user_email:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await User.find_one({"email": user_email})
        if not user:
            raise HTTPException(status_code=401, detail=f"User not found: {user_email}")
        
        if not user.is_active:
            raise HTTPException(status_code=401, detail="User account is inactive")
        
        return user
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")


async def get_current_user_permissions(user: User = Depends(get_current_user)) -> List[PermissionType]:
    """Get all permissions for the current user based on their roles"""
    permissions = set()
    
    for role_assignment in user.role_assignments:
        role = await Role.get(role_assignment.role_id)
        if role:
            permissions.update(role.permissions)
    
    return list(permissions)


def require_permissions(required_permissions: List[PermissionType]):
    """Decorator to require specific permissions for an endpoint"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user from kwargs (should be injected by FastAPI)
            user = None
            user_permissions = []
            
            for key, value in kwargs.items():
                if isinstance(value, User):
                    user = value
                    break
            
            if not user:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            # Get user permissions
            user_permissions = await get_current_user_permissions(user)
            
            # Check if user has all required permissions
            missing_permissions = [
                perm for perm in required_permissions 
                if perm not in user_permissions
            ]
            
            if missing_permissions:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Insufficient permissions. Missing: {', '.join(missing_permissions)}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_any_permission(required_permissions: List[PermissionType]):
    """Decorator to require at least one of the specified permissions"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user from kwargs
            user = None
            for key, value in kwargs.items():
                if isinstance(value, User):
                    user = value
                    break
            
            if not user:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            # Get user permissions
            user_permissions = await get_current_user_permissions(user)
            
            # Check if user has at least one of the required permissions
            has_permission = any(perm in user_permissions for perm in required_permissions)
            
            if not has_permission:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Insufficient permissions. Need one of: {', '.join(required_permissions)}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_role(required_roles: List[str]):
    """Decorator to require specific roles"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user from kwargs
            user = None
            for key, value in kwargs.items():
                if isinstance(value, User):
                    user = value
                    break
            
            if not user:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            # Check if user has any of the required roles
            user_roles = user.get_role_names()
            has_role = any(role in user_roles for role in required_roles)
            
            if not has_role:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Insufficient role. Need one of: {', '.join(required_roles)}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


async def check_resource_ownership(user: User, resource_user_id: str) -> bool:
    """Check if user owns a resource or has admin permissions"""
    if str(user.id) == resource_user_id:
        return True
    
    # Check if user has admin permissions
    user_permissions = await get_current_user_permissions(user)
    admin_permissions = [
        PermissionType.MANAGE_ROLES,
        PermissionType.SYSTEM_SETTINGS
    ]
    
    return any(perm in user_permissions for perm in admin_permissions)


def require_ownership_or_permission(permission: PermissionType, resource_user_field: str = "user_id"):
    """Decorator to require resource ownership or specific permission"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user from kwargs
            user = None
            for key, value in kwargs.items():
                if isinstance(value, User):
                    user = value
                    break
            
            if not user:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            # Get resource user ID from kwargs
            resource_user_id = kwargs.get(resource_user_field)
            
            if resource_user_id:
                # Check ownership
                if await check_resource_ownership(user, resource_user_id):
                    return await func(*args, **kwargs)
            
            # Check permission
            user_permissions = await get_current_user_permissions(user)
            if permission not in user_permissions:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Insufficient permissions. Need {permission} or resource ownership"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator