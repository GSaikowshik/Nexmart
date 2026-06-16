from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from jose import jwt, JWTError
from typing import Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=False)

class SupabaseAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Extract Authorization header
        auth_header = request.headers.get("Authorization")
        request.state.user = None

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                # Check if we should use mock auth fallback
                if settings.supabase_jwt_secret.startswith("placeholder") or token == "dev-mock-token":
                    request.state.user = {
                        "id": "00000000-0000-0000-0000-000000000000",
                        "email": "mockuser@example.com",
                        "role": "authenticated"
                    }
                else:
                    payload = jwt.decode(
                        token,
                        settings.supabase_jwt_secret,
                        algorithms=["HS256"],
                        options={"verify_aud": False}  # Aud field can vary in Supabase
                    )
                    user_id = payload.get("sub")
                    if not user_id:
                        return JSONResponse(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            content={"detail": "Token payload is missing subject (sub)"},
                            headers={"WWW-Authenticate": "Bearer"}
                        )
                    
                    request.state.user = {
                        "id": user_id,
                        "email": payload.get("email"),
                        "role": payload.get("role", "authenticated")
                    }
            except JWTError as e:
                logger.error(f"JWT verification failed in middleware: {e}")
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": f"Could not validate credentials: {str(e)}"},
                    headers={"WWW-Authenticate": "Bearer"}
                )

        response = await call_next(request)
        return response

def get_current_user(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    """
    Decodes and verifies the Supabase JWT token pre-processed by SupabaseAuthMiddleware.
    Returns the user payload if valid.
    """
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided or are invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

