from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, AliasChoices

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    supabase_url: str = Field(..., validation_alias="SUPABASE_URL")
    supabase_anon_key: str = Field(
        ..., 
        validation_alias=AliasChoices("SUPABASE_ANON_KEY", "SUPABASE_KEY", "supabase_key")
    )
    supabase_service_role_key: Optional[str] = Field(None, validation_alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str = Field("placeholder-secret", validation_alias="SUPABASE_JWT_SECRET")
    host: str = Field("127.0.0.1", validation_alias="HOST")
    port: int = Field(8000, validation_alias="PORT")

settings = Settings()
