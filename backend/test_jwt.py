import jwt
from app.utils.config import get_settings

# Test JWT token decoding with the current settings
settings = get_settings()

def test_jwt_token():
    print(f"Current secret key: {settings.secret_key}")
    print(f"Algorithm: {settings.algorithm}")
    
    # Test token creation
    test_payload = {"sub": "test@example.com", "user_id": "123", "roles": ["Super Admin"]}
    token = jwt.encode(test_payload, settings.secret_key, algorithm=settings.algorithm)
    print(f"Created token: {token}")
    
    # Test token decoding
    try:
        decoded = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        print(f"Decoded successfully: {decoded}")
    except Exception as e:
        print(f"Decode failed: {e}")

if __name__ == "__main__":
    test_jwt_token()