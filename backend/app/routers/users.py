from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from datetime import datetime
from app.core.security import get_current_user
from app.core.database import supabase_client, MOCK_PROFILES
from app.schemas.schemas import Profile, ProfileBase

router = APIRouter()

@router.get("/me", response_model=Profile)
def get_profile(current_user: dict = Depends(get_current_user)):
    """Get the current user's profile details."""
    user_uuid = UUID(current_user["id"])
    email = current_user.get("email", "user@example.com")
    
    if supabase_client is not None:
        try:
            res = supabase_client.table("profiles").select("*").eq("id", str(user_uuid)).maybe_single().execute()
            if res.data:
                return Profile(**res.data)
        except Exception:
            pass

    # Mock fallback
    if user_uuid not in MOCK_PROFILES:
        MOCK_PROFILES[user_uuid] = {
            "id": user_uuid,
            "full_name": current_user.get("email", "").split("@")[0].capitalize() or "Demo User",
            "avatar_url": "",
            "phone_number": "",
            "billing_address": {},
            "shipping_address": {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    return Profile(**MOCK_PROFILES[user_uuid])

@router.put("/me", response_model=Profile)
def update_profile(profile_data: ProfileBase, current_user: dict = Depends(get_current_user)):
    """Update the current user's profile information."""
    user_uuid = UUID(current_user["id"])
    update_dict = profile_data.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.utcnow().isoformat()

    if supabase_client is not None:
        try:
            res = supabase_client.table("profiles").update(update_dict).eq("id", str(user_uuid)).execute()
            if res.data:
                return Profile(**res.data[0])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database update failed: {str(e)}")

    # Mock fallback
    current_profile = get_profile(current_user=current_user).dict()
    for key, value in update_dict.items():
        if key in current_profile:
            current_profile[key] = value
            
    current_profile["updated_at"] = datetime.utcnow()
    MOCK_PROFILES[user_uuid] = current_profile
    return Profile(**current_profile)
