from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.core.database import supabase_client, MOCK_CATEGORIES, MOCK_PRODUCTS
from app.schemas.schemas import Product, Category

router = APIRouter()

@router.get("/categories", response_model=List[Category])
def get_categories():
    """Get all product categories."""
    if supabase_client is not None:
        try:
            response = supabase_client.table("categories").select("*").execute()
            return response.data
        except Exception as e:
            # Fallback on error
            pass
    return MOCK_CATEGORIES

@router.get("/products", response_model=List[Product])
def get_products(
    category_slug: Optional[str] = Query(None, description="Filter products by category slug"),
    search: Optional[str] = Query(None, description="Search products by name or description"),
    featured: Optional[bool] = Query(None, description="Filter featured products"),
    sort_by: Optional[str] = Query(None, description="Sort options: price_asc, price_desc, rating_desc")
):
    """List all products with filters."""
    products_to_return = []

    # Try to fetch from Supabase
    if supabase_client is not None:
        try:
            query = supabase_client.table("products").select("*, categories(*)")
            
            # Note: Complex filtering logic using supabase client syntax
            if featured is not None:
                query = query.eq("is_featured", featured)
                
            response = query.execute()
            products_to_return = response.data
            
            # Post-filter in python for slug or category fields if needed, or query join
            if category_slug:
                products_to_return = [
                    p for p in products_to_return 
                    if p.get("categories") and p["categories"].get("slug") == category_slug
                ]
            
            # Flatten category reference if needed for schema matching
            for p in products_to_return:
                if "category_id" not in p and p.get("categories"):
                    p["category_id"] = p["categories"]["id"]
            
        except Exception as e:
            # Fallback to mock data on supabase error
            products_to_return = MOCK_PRODUCTS.copy()
    else:
        products_to_return = MOCK_PRODUCTS.copy()

    # Apply category filter for Mock data
    if not supabase_client or not products_to_return:
        products_to_return = MOCK_PRODUCTS.copy()
        if category_slug:
            # Find category id
            cat = next((c for c in MOCK_CATEGORIES if c["slug"] == category_slug), None)
            if cat:
                products_to_return = [p for p in products_to_return if p["category_id"] == cat["id"]]
            else:
                products_to_return = []

    # Apply featured filter for mock data
    if featured is not None and (not supabase_client or not response.data):
        products_to_return = [p for p in products_to_return if p["is_featured"] == featured]

    # Apply search filter
    if search:
        search_lower = search.lower()
        products_to_return = [
            p for p in products_to_return
            if search_lower in p["name"].lower() or search_lower in p["description"].lower()
        ]

    # Apply sorting
    if sort_by == "price_asc":
        products_to_return.sort(key=lambda x: x["price"])
    elif sort_by == "price_desc":
        products_to_return.sort(key=lambda x: x["price"], reverse=True)
    elif sort_by == "rating_desc":
        products_to_return.sort(key=lambda x: x["rating"], reverse=True)

    return products_to_return

@router.get("/products/{slug}", response_model=Product)
def get_product(slug: str):
    """Get details of a single product by slug."""
    if supabase_client is not None:
        try:
            response = supabase_client.table("products").select("*").eq("slug", slug).maybe_single().execute()
            if response.data:
                return response.data
        except Exception:
            pass
            
    # Mock fallback
    product = next((p for p in MOCK_PRODUCTS if p["slug"] == slug), None)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
