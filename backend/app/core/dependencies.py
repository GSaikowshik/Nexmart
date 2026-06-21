from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.database import supabase_client
from app.core.config import settings

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Dependency to verify the Supabase Bearer token and return the user's info.
    Supports a mock auth token 'dev-mock-token' if the key or url is placeholder.
    """
    token = credentials.credentials
    try:
        # Check if we should use mock auth fallback
        # In a development environment, if Supabase client is not initialized or token is mock
        is_mock = (
            supabase_client is None or 
            settings.supabase_url.startswith("https://placeholder") or 
            token == "dev-mock-token"
        )
        if is_mock:
            # Return a mock user dict
            return {
                "id": "00000000-0000-0000-0000-000000000000",
                "email": "mockuser@example.com"
            }

        # Verify using Supabase API
        res = supabase_client.auth.get_user(token)
        if not res or not res.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return {
            "id": res.user.id,
            "email": res.user.email
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
