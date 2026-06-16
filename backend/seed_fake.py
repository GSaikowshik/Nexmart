import sys
import re
import random
import httpx
from app.core.config import settings
from app.core.database import supabase_client

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    return text.strip('-')

def seed_fake_data():
    print("Checking Supabase connection configurations...")
    if not supabase_client:
        print("Error: Supabase client is not initialized. Please configure SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env")
        sys.exit(1)

    print("Fetching sample products from Fake Store API...")
    try:
        response = httpx.get("https://fakestoreapi.com/products")
        response.raise_for_status()
        products_data = response.json()
        print(f"Successfully fetched {len(products_data)} products.")
    except Exception as e:
        print(f"Error fetching products from Fake Store API: {e}")
        sys.exit(1)

    # Process and seed categories first
    print("\nProcessing categories...")
    category_map = {}
    for item in products_data:
        cat_name = item.get("category")
        if cat_name and cat_name not in category_map:
            cat_slug = slugify(cat_name)
            # Check if category already exists in database
            try:
                res = supabase_client.table("categories").select("id").eq("name", cat_name).execute()
                if res.data:
                    category_map[cat_name] = res.data[0]["id"]
                    print(f"Category '{cat_name}' already exists with ID: {res.data[0]['id']}")
                else:
                    # Create new category
                    # We can use the product's image as category image for visual pop
                    cat_res = supabase_client.table("categories").insert({
                        "name": cat_name,
                        "slug": cat_slug,
                        "description": f"Explore our premium selection of {cat_name}.",
                        "image_url": item.get("image")
                    }).execute()
                    if cat_res.data:
                        cat_id = cat_res.data[0]["id"]
                        category_map[cat_name] = cat_id
                        print(f"Created category '{cat_name}' with ID: {cat_id}")
            except Exception as e:
                print(f"Error checking/creating category '{cat_name}': {e}")

    # Seed products
    print("\nSeeding products...")
    for idx, item in enumerate(products_data):
        title = item.get("title")
        price = float(item.get("price", 0.0))
        description = item.get("description")
        category_name = item.get("category")
        image_url = item.get("image")
        rating_data = item.get("rating", {})
        rating = float(rating_data.get("rate", 4.0))

        category_id = category_map.get(category_name)
        if not category_id:
            print(f"Skipping product '{title}' as its category '{category_name}' was not created/resolved.")
            continue

        prod_slug = slugify(title)
        # Ensure slug is unique by appending fake API ID if needed
        prod_slug = f"{prod_slug}-{item.get('id')}"

        product_record = {
            "category_id": category_id,
            "name": title,
            "slug": prod_slug,
            "description": description,
            "price": price,
            "compare_at_price": round(price * 1.2, 2),
            "stock_quantity": random.randint(15, 80),
            "image_urls": [image_url] if image_url else [],
            "is_featured": random.choice([True, False]),
            "rating": rating
        }

        try:
            # We use upsert on conflict of 'slug'
            res = supabase_client.table("products").upsert(product_record, on_conflict="slug").execute()
            print(f"[{idx+1}/{len(products_data)}] Upserted product: {title} (${price})")
        except Exception as e:
            print(f"Error upserting product '{title}': {e}")

    print("\nDatabase seeding from Fake Store API complete!")

if __name__ == "__main__":
    seed_fake_data()
