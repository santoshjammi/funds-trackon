"""
Authentication Controller - Handles user authentication endpoints
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from app.models.user import User, EmploymentType
from app.utils.config import get_settings
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext

auth_router = APIRouter(tags=["authentication"])
settings = get_settings()

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings from config
SECRET_KEY = settings.secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Request/Response models
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserLoginByUsername(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    designation: str
    employment_type: str = "Employee"
    username: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

@auth_router.post("/register", response_model=dict)
async def register(user_data: UserRegister):
    """Register a new user"""
    # Check if user already exists
    existing_user = await User.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Check if username already exists (if provided)
    if user_data.username:
        existing_username = await User.find_one({"username": user_data.username})
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this username already exists"
            )
    
    # Hash password
    password_hash = pwd_context.hash(user_data.password)
    
    # Create user
    user = User(
        email=user_data.email,
        password_hash=password_hash,
        name=user_data.name,
        designation=user_data.designation,
        employment_type=user_data.employment_type,
        username=user_data.username or user_data.email.split('@')[0],
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    await user.insert()
    
    return {"message": "User registered successfully", "user_id": str(user.id)}

@auth_router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Authenticate user and return JWT token"""
    # Find user by email
    user = await User.find_one({"email": user_credentials.email})
    # Temporary plain text password check for testing
    if not user or not user.password_hash or user.password_hash != user_credentials.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled",
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await user.save()
    
    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.id), "roles": user.get_role_names()}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@auth_router.post("/login-username", response_model=Token)
async def login_username(user_credentials: UserLoginByUsername):
    """Authenticate user by username and return JWT token"""
    # Debug logging
    print(f"DEBUG: Login attempt - username: '{user_credentials.username}', password: '{user_credentials.password}'")
    
    # Find user by username  
    user = await User.find_one({"username": user_credentials.username})
    print(f"DEBUG: User found: {user is not None}")
    if user:
        print(f"DEBUG: User details - username: '{user.username}', password_hash: '{repr(user.password_hash)}', active: {user.is_active}")
        print(f"DEBUG: Incoming password: '{repr(user_credentials.password)}'")
        print(f"DEBUG: Password match: {user.password_hash == user_credentials.password}")
        print(f"DEBUG: Password hash type: {type(user.password_hash)}")
        print(f"DEBUG: Incoming password type: {type(user_credentials.password)}")
    
    # Temporary plain text password check for testing
    if not user or not user.password_hash or user.password_hash != user_credentials.password:
        print(f"DEBUG: Authentication failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is disabled",
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    await user.save()
    
    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.id), "roles": user.get_role_names()}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await User.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

@auth_router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user information with roles"""
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "username": current_user.username,
        "designation": current_user.designation,
        "employment_type": current_user.employment_type.value if current_user.employment_type else None,
        "role_names": current_user.get_role_names(),
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else None
    }