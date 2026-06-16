from supabase import create_client, Client
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize the Supabase client
supabase_client: Client = None

try:
    if not settings.supabase_url.startswith("https://placeholder"):
        supabase_client = create_client(settings.supabase_url, settings.supabase_anon_key)
        logger.info("Supabase client initialized successfully.")
    else:
        logger.warning("Supabase URL is placeholder. Database operations will use mock in-memory data.")
except Exception as e:
    logger.error(f"Error initializing Supabase client: {e}. Falling back to mock data.")

# In-memory mock database for local development
MOCK_CATEGORIES = [
    {"id": 1, "name": "Electronics", "slug": "electronics", "description": "High-tech gadgets and devices", "image_url": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500"},
    {"id": 2, "name": "Fashion", "slug": "fashion", "description": "Trendsetting apparel and accessories", "image_url": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500"},
    {"id": 3, "name": "Home & Kitchen", "slug": "home-kitchen", "description": "Beautiful furniture and kitchenware", "image_url": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500"}
]

MOCK_PRODUCTS = [
    {
        "id": 1,
        "category_id": 1,
        "name": "Wireless Noise-Cancelling Headphones",
        "slug": "wireless-headphones",
        "description": "Experience premium sound quality with active noise cancellation and 40-hour battery life.",
        "price": 299.99,
        "compare_at_price": 349.99,
        "stock_quantity": 25,
        "image_urls": ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"],
        "is_featured": True,
        "rating": 4.8
    },
    {
        "id": 2,
        "category_id": 1,
        "name": "Smart Fitness Watch",
        "slug": "smart-fitness-watch",
        "description": "Track your heart rate, sleep quality, and daily activities with a sleek, water-resistant design.",
        "price": 199.99,
        "compare_at_price": 229.99,
        "stock_quantity": 40,
        "image_urls": ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"],
        "is_featured": True,
        "rating": 4.5
    },
    {
        "id": 3,
        "category_id": 2,
        "name": "Classic Leather Jacket",
        "slug": "classic-leather-jacket",
        "description": "Timeless genuine leather jacket with asymmetrical zipper and premium lining.",
        "price": 149.99,
        "compare_at_price": 189.99,
        "stock_quantity": 15,
        "image_urls": ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500"],
        "is_featured": False,
        "rating": 4.6
    },
    {
        "id": 4,
        "category_id": 2,
        "name": "Minimalist Canvas Backpack",
        "slug": "minimalist-backpack",
        "description": "Durable water-resistant backpack, perfect for daily commute and travel.",
        "price": 59.99,
        "compare_at_price": 79.99,
        "stock_quantity": 50,
        "image_urls": ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500"],
        "is_featured": True,
        "rating": 4.3
    },
    {
        "id": 5,
        "category_id": 3,
        "name": "Ceramic Pour-Over Coffee Set",
        "slug": "pour-over-coffee-set",
        "description": "Elegant ceramic dripper and glass server for crafting the perfect morning brew.",
        "price": 45.00,
        "compare_at_price": 45.00,
        "stock_quantity": 30,
        "image_urls": ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500"],
        "is_featured": False,
        "rating": 4.9
    }
]

# In-memory stores for mock databases (keyed by user_id or order_id)
MOCK_CARTS = {} # user_id -> [ {product_id, quantity} ]
MOCK_ORDERS = {} # user_id -> [ orders ]
MOCK_REVIEWS = {} # product_id -> [ reviews ]
MOCK_PROFILES = {} # user_id -> profile
