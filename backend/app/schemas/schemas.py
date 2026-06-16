from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime
from uuid import UUID

# ----------------------------------------
# Category Schemas
# ----------------------------------------
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None

class Category(CategoryBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------------------------------
# Product Schemas
# ----------------------------------------
class ProductBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    compare_at_price: Optional[float] = None
    stock_quantity: int
    image_urls: List[str] = []
    category_id: Optional[int] = None
    is_featured: Optional[bool] = False

class Product(ProductBase):
    id: int
    rating: float
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------------------------------
# Cart Schemas
# ----------------------------------------
class CartItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class CartItemCreate(CartItemBase):
    pass

class CartItem(CartItemBase):
    id: int
    user_id: UUID
    created_at: Optional[datetime] = None
    product: Optional[Product] = None

    class Config:
        from_attributes = True

class CartSummary(BaseModel):
    items: List[CartItem]
    total_items: int
    total_price: float

# ----------------------------------------
# Order Schemas
# ----------------------------------------
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class OrderItem(OrderItemBase):
    id: int
    order_id: UUID
    unit_price: float
    product: Optional[Product] = None

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    shipping_address: dict
    billing_address: dict

class Order(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    status: str
    total_amount: float
    shipping_address: dict
    billing_address: dict
    payment_status: str
    payment_intent_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: List[OrderItem] = []

    class Config:
        from_attributes = True

# ----------------------------------------
# User / Profile Schemas
# ----------------------------------------
class ProfileBase(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    phone_number: Optional[str] = None
    billing_address: Optional[dict] = None
    shipping_address: Optional[dict] = None

class Profile(ProfileBase):
    id: UUID
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------------------------------
# Review Schemas
# ----------------------------------------
class ReviewCreate(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class Review(ReviewCreate):
    id: int
    user_id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
