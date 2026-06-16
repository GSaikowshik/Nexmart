from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.core.config import settings
from app.routers import products, cart, orders, users
from app.core.security import SupabaseAuthMiddleware

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="E-Commerce API Service",
    description="Backend service powering catalog, cart, and orders.",
    version="1.0.0",
)

# Set up Supabase Authentication middleware
app.add_middleware(SupabaseAuthMiddleware)

# Set up CORS middleware to allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API routers
app.include_router(products.router, prefix="/api/v1", tags=["Products"])
app.include_router(cart.router, prefix="/api/v1/cart", tags=["Cart"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])

@app.get("/")
def health_check():
    """Root health check endpoint."""
    return {
        "status": "healthy",
        "service": "ecommerce-api-backend",
        "version": "1.0.0",
        "database_connected": settings.supabase_url != "https://placeholder-project.supabase.co"
    }

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on {settings.host}:{settings.port}")
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
