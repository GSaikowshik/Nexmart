import os
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables (SUPABASE_URL and SUPABASE_KEY)
load_dotenv()

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def seed_products():
    print("Fetching realistic product data...")
    # Get 20 mock products from FakeStore API
    response = requests.get("https://fakestoreapi.com/products")
    
    if response.status_code != 200:
        print("Failed to fetch products.")
        return

    products = response.json()
    formatted_products = []

    # Map the API data to match our Supabase table structure
    for p in products:
        formatted_products.append({
            "title": p["title"],
            "price": p["price"],
            "description": p["description"],
            "category": p["category"],
            "image_url": p["image"]
        })

    print(f"Inserting {len(formatted_products)} products into Supabase...")
    
    # Insert the data into the 'products' table
    try:
        response = supabase.table("products").insert(formatted_products).execute()
        print("Success! Products are now live on NexMart.")
    except Exception as e:
        print(f"Error inserting into Supabase: {e}")

if __name__ == "__main__":
    seed_products()