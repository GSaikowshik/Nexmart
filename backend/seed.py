import sys
from app.core.config import settings
from app.core.database import supabase_client, MOCK_CATEGORIES, MOCK_PRODUCTS

def seed_database():
    """Seeds the Supabase database with initial categories and products."""
    print("Checking Supabase connection configurations...")
    if not supabase_client:
        print("Error: Supabase client is not initialized. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in backend/.env")
        sys.exit(1)

    print("Seeding Categories...")
    for category in MOCK_CATEGORIES:
        try:
            # We insert categories
            res = supabase_client.table("categories").upsert({
                "id": category["id"],
                "name": category["name"],
                "slug": category["slug"],
                "description": category["description"],
                "image_url": category["image_url"]
            }, on_conflict="name").execute()
            print(f"Upserted Category: {category['name']}")
        except Exception as e:
            print(f"Error seeding category {category['name']}: {e}")

    print("Seeding Products...")
    for product in MOCK_PRODUCTS:
        try:
            res = supabase_client.table("products").upsert({
                "id": product["id"],
                "category_id": product["category_id"],
                "name": product["name"],
                "slug": product["slug"],
                "description": product["description"],
                "price": product["price"],
                "compare_at_price": product["compare_at_price"],
                "stock_quantity": product["stock_quantity"],
                "image_urls": product["image_urls"],
                "is_featured": product["is_featured"],
                "rating": product["rating"]
            }, on_conflict="slug").execute()
            print(f"Upserted Product: {product['name']}")
        except Exception as e:
            print(f"Error seeding product {product['name']}: {e}")

    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
