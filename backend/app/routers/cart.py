from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.core.security import get_current_user
from app.core.database import supabase_client, MOCK_CARTS, MOCK_PRODUCTS
from app.schemas.schemas import CartItem, CartItemCreate, CartSummary, Product

router = APIRouter()

def get_product_by_id(product_id: int) -> Optional[dict]:
    # Helper to get product details
    if supabase_client is not None:
        try:
            res = supabase_client.table("products").select("*").eq("id", product_id).maybe_single().execute()
            if res.data:
                return res.data
        except Exception:
            pass
    return next((p for p in MOCK_PRODUCTS if p["id"] == product_id), None)

@router.get("", response_model=CartSummary)
def get_cart(current_user: dict = Depends(get_current_user)):
    """Retrieve the current user's cart."""
    user_uuid = UUID(current_user["id"])
    cart_items = []
    
    if supabase_client is not None:
        try:
            # Query db for cart items joined with products
            response = supabase_client.table("cart_items").select("*, products(*)").eq("user_id", str(user_uuid)).execute()
            
            for item in response.data:
                # Format to schema
                prod_data = item.get("products")
                cart_items.append(
                    CartItem(
                        id=item["id"],
                        user_id=user_uuid,
                        product_id=item["product_id"],
                        quantity=item["quantity"],
                        created_at=datetime.fromisoformat(item["created_at"].replace("Z", "+00:00")),
                        product=Product(**prod_data) if prod_data else None
                    )
                )
        except Exception as e:
            # Fallback on DB exception
            pass

    # In-memory fallback
    if supabase_client is None or not cart_items:
        mock_items = MOCK_CARTS.get(user_uuid, [])
        for i, item in enumerate(mock_items):
            prod_data = get_product_by_id(item["product_id"])
            cart_items.append(
                CartItem(
                    id=i + 1,
                    user_id=user_uuid,
                    product_id=item["product_id"],
                    quantity=item["quantity"],
                    created_at=datetime.utcnow(),
                    product=Product(**prod_data) if prod_data else None
                )
            )

    total_items = sum(item.quantity for item in cart_items)
    total_price = sum(item.quantity * (item.product.price if item.product else 0.0) for item in cart_items)

    return CartSummary(items=cart_items, total_items=total_items, total_price=total_price)

@router.post("", response_model=CartSummary)
def add_to_cart(cart_item: CartItemCreate, current_user: dict = Depends(get_current_user)):
    """Add an item or update its quantity in the cart."""
    user_uuid = UUID(current_user["id"])
    prod = get_product_by_id(cart_item.product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    if supabase_client is not None:
        try:
            # Upsert into cart_items
            # Supabase handles UNIQUE(user_id, product_id)
            res = supabase_client.table("cart_items").upsert({
                "user_id": str(user_uuid),
                "product_id": cart_item.product_id,
                "quantity": cart_item.quantity
            }, on_conflict="user_id,product_id").execute()
        except Exception as e:
            pass

    # In-memory fallback
    mock_items = MOCK_CARTS.get(user_uuid, [])
    existing_item = next((item for item in mock_items if item["product_id"] == cart_item.product_id), None)
    if existing_item:
        existing_item["quantity"] = cart_item.quantity
    else:
        mock_items.append({
            "product_id": cart_item.product_id,
            "quantity": cart_item.quantity
        })
    MOCK_CARTS[user_uuid] = mock_items

    return get_cart(current_user=current_user)

@router.delete("/clear", response_model=CartSummary)
def clear_cart(current_user: dict = Depends(get_current_user)):
    """Clear all items from the user's cart."""
    user_uuid = UUID(current_user["id"])

    if supabase_client is not None:
        try:
            supabase_client.table("cart_items").delete().eq("user_id", str(user_uuid)).execute()
        except Exception:
            pass

    # In-memory fallback
    MOCK_CARTS[user_uuid] = []

    return get_cart(current_user=current_user)

@router.delete("/{product_id}", response_model=CartSummary)
def remove_from_cart(product_id: int, current_user: dict = Depends(get_current_user)):
    """Remove a product from the user's cart."""
    user_uuid = UUID(current_user["id"])

    if supabase_client is not None:
        try:
            supabase_client.table("cart_items").delete().eq("user_id", str(user_uuid)).eq("product_id", product_id).execute()
        except Exception:
            pass

    # In-memory fallback
    mock_items = MOCK_CARTS.get(user_uuid, [])
    MOCK_CARTS[user_uuid] = [item for item in mock_items if item["product_id"] != product_id]

    return get_cart(current_user=current_user)

