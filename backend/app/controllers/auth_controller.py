"""
Authentication Controller - Handles user authentication endpoints
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from app.models.user import User
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext

auth_router = APIRouter(prefix="/auth", tags=["authentication"])

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings (should be in config)
SECRET_KEY = "your-secret-key-change-this"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Request/Response models
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

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
    
    # Hash password
    hashed_password = pwd_context.hash(user_data.password)
    
    # Create user
    user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        is_active=True,
        created_at=datetime.utcnow()
    )
    
    await user.insert()
    
    return {"message": "User registered successfully", "user_id": str(user.id)}

@auth_router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Authenticate user and return JWT token"""
    # Find user
    user = await User.find_one({"email": user_credentials.email})
    if not user or not pwd_context.verify(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
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