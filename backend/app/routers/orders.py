from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime
import logging
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.database import supabase_client, MOCK_ORDERS, MOCK_PRODUCTS, MOCK_CARTS
from app.schemas.schemas import Order, OrderCreate, OrderItem, Product

router = APIRouter()
logger = logging.getLogger(__name__)

def get_product_by_id(product_id: int) -> Optional[dict]:
    if supabase_client is not None:
        try:
            res = supabase_client.table("products").select("*").eq("id", product_id).maybe_single().execute()
            if res.data:
                return res.data
        except Exception:
            pass
    return next((p for p in MOCK_PRODUCTS if p["id"] == product_id), None)

def decrement_product_stock(product_id: int, quantity: int):
    # Decrements stock in database/mock store
    if supabase_client is not None:
        try:
            # First fetch current stock
            res = supabase_client.table("products").select("stock_quantity").eq("id", product_id).single().execute()
            if res.data:
                current_stock = res.data["stock_quantity"]
                new_stock = max(0, current_stock - quantity)
                supabase_client.table("products").update({"stock_quantity": new_stock}).eq("id", product_id).execute()
                return
        except Exception as e:
            logger.error(f"Failed to decrement stock in DB: {e}")
            
    # Mock fallback
    p = next((prod for prod in MOCK_PRODUCTS if prod["id"] == product_id), None)
    if p:
        p["stock_quantity"] = max(0, p["stock_quantity"] - quantity)

@router.post("", response_model=Order)
def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    """
    Create a new order from items currently in the user's cart.
    Calculates total amount, validates stock, creates order & order items,
    and returns the order details.
    """
    user_uuid = UUID(current_user["id"])
    
    # 1. Fetch Cart Items
    cart_items = []
    if supabase_client is not None:
        try:
            res = supabase_client.table("cart_items").select("*, products(*)").eq("user_id", str(user_uuid)).execute()
            cart_items = res.data
        except Exception:
            pass
            
    if supabase_client is None or not cart_items:
        # Fallback to mock cart
        mock_items = MOCK_CARTS.get(user_uuid, [])
        cart_items = []
        for i, item in enumerate(mock_items):
            prod = get_product_by_id(item["product_id"])
            if prod:
                cart_items.append({
                    "product_id": item["product_id"],
                    "quantity": item["quantity"],
                    "products": prod
                })

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cannot place an order with an empty cart")

    # 2. Validate Stock and Calculate Total Price
    total_amount = 0.0
    items_to_create = []
    
    for item in cart_items:
        # Check if products is a dictionary (from DB join or mock)
        prod = item.get("products")
        qty = item["quantity"]
        
        if not prod:
            raise HTTPException(status_code=400, detail="Product in cart not found")
            
        if prod["stock_quantity"] < qty:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for product '{prod['name']}'. Available: {prod['stock_quantity']}"
            )
            
        total_amount += prod["price"] * qty
        items_to_create.append({
            "product_id": item["product_id"],
            "quantity": qty,
            "unit_price": prod["price"],
            "product": Product(**prod)
        })

    order_id = uuid4()
    
    new_order = {
        "id": order_id,
        "user_id": user_uuid,
        "status": "processing",
        "total_amount": total_amount,
        "shipping_address": order_data.shipping_address,
        "billing_address": order_data.billing_address,
        "payment_status": "paid",
        "payment_intent_id": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    # 3. Save Order and Order Items
    db_success = False
    if supabase_client is not None:
        try:
            # Insert Order
            supabase_client.table("orders").insert({
                "id": str(order_id),
                "user_id": str(user_uuid),
                "status": "processing",
                "total_amount": total_amount,
                "shipping_address": order_data.shipping_address,
                "billing_address": order_data.billing_address,
                "payment_status": "paid"
            }).execute()

            # Insert Order Items
            for item in items_to_create:
                supabase_client.table("order_items").insert({
                    "order_id": str(order_id),
                    "product_id": item["product_id"],
                    "quantity": item["quantity"],
                    "unit_price": item["unit_price"]
                }).execute()
                # Decrement stock in DB
                decrement_product_stock(item["product_id"], item["quantity"])

            # Clear cart in DB
            supabase_client.table("cart_items").delete().eq("user_id", str(user_uuid)).execute()
            db_success = True
        except Exception as e:
            logger.error(f"Failed to persist order in Supabase: {e}")
            # Continue to mock return if database fails
            pass

    # Save to mock store
    user_orders = MOCK_ORDERS.get(user_uuid, [])
    
    # Format order items for response model
    response_items = []
    for i, item in enumerate(items_to_create):
        response_items.append(
            OrderItem(
                id=i + 1,
                order_id=order_id,
                product_id=item["product_id"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                product=item["product"]
            )
        )
        if not db_success:
            decrement_product_stock(item["product_id"], item["quantity"])
        
    mock_order_record = {**new_order, "items": response_items}
    user_orders.append(mock_order_record)
    MOCK_ORDERS[user_uuid] = user_orders

    # Clear mock cart
    MOCK_CARTS[user_uuid] = []

    return Order(**mock_order_record)

@router.get("", response_model=List[Order])
def list_orders(current_user: dict = Depends(get_current_user)):
    """List all orders for the current logged-in user."""
    user_uuid = UUID(current_user["id"])
    orders_to_return = []

    if supabase_client is not None:
        try:
            # Get orders ordered by created_at desc
            res = supabase_client.table("orders").select("*").eq("user_id", str(user_uuid)).order("created_at", desc=True).execute()
            for order in res.data:
                # Get order items for each order
                items_res = supabase_client.table("order_items").select("*, products(*)").eq("order_id", order["id"]).execute()
                items = []
                for item in items_res.data:
                    prod = item.get("products")
                    items.append(
                        OrderItem(
                            id=item["id"],
                            order_id=UUID(item["order_id"]),
                            product_id=item["product_id"],
                            quantity=item["quantity"],
                            unit_price=item["unit_price"],
                            product=Product(**prod) if prod else None
                        )
                    )
                orders_to_return.append(Order(**order, items=items))
            return orders_to_return
        except Exception as e:
            logger.error(f"Failed to list orders from DB: {e}")
            pass

    # Mock fallback
    user_orders = MOCK_ORDERS.get(user_uuid, [])
    # Sort mock orders by created_at descending
    user_orders = sorted(user_orders, key=lambda o: o.get("created_at") or datetime.utcnow(), reverse=True)
    return user_orders

@router.get("/{id}", response_model=Order)
def get_order_details(id: UUID, current_user: dict = Depends(get_current_user)):
    """Get detailed information of a specific order."""
    user_uuid = UUID(current_user["id"])
    
    if supabase_client is not None:
        try:
            res = supabase_client.table("orders").select("*").eq("id", str(id)).eq("user_id", str(user_uuid)).maybe_single().execute()
            if res.data:
                order = res.data
                items_res = supabase_client.table("order_items").select("*, products(*)").eq("order_id", str(id)).execute()
                items = []
                for item in items_res.data:
                    prod = item.get("products")
                    items.append(
                        OrderItem(
                            id=item["id"],
                            order_id=UUID(item["order_id"]),
                            product_id=item["product_id"],
                            quantity=item["quantity"],
                            unit_price=item["unit_price"],
                            product=Product(**prod) if prod else None
                        )
                    )
                return Order(**order, items=items)
        except Exception:
            pass

    # Mock fallback
    user_orders = MOCK_ORDERS.get(user_uuid, [])
    order = next((o for o in user_orders if o["id"] == id), None)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**order)

@router.post("/checkout", response_model=Order)
def checkout_cart(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    """
    Finalize checkout: converts the cart items to an order and clears the cart.
    """
    return create_order(order_data, current_user)

