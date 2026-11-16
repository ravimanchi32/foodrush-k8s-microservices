from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

# Menu Item Schemas
class MenuItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    category: str
    image_url: Optional[str] = None
    is_available: bool = True

class MenuItemCreate(MenuItemBase):
    restaurant_id: int

class MenuItemResponse(MenuItemBase):
    id: int
    restaurant_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Restaurant Schemas
class RestaurantBase(BaseModel):
    name: str
    description: Optional[str] = None
    cuisine: str
    image_url: Optional[str] = None
    rating: Decimal = Decimal("4.5")
    address: str
    is_active: bool = True

class RestaurantCreate(RestaurantBase):
    pass

class RestaurantResponse(RestaurantBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RestaurantDetailResponse(RestaurantResponse):
    menu_items: List[MenuItemResponse] = []

# Order & Payment Schemas
class OrderItemInput(BaseModel):
    menu_item_id: int
    quantity: int = Field(gt=0, description="Quantity must be greater than zero")

class OrderCreate(BaseModel):
    restaurant_id: int
    delivery_address: str
    items: List[OrderItemInput]
    payment_method: str = "CARD"  # CARD, UPI, CASH_ON_DELIVERY

class OrderStatusUpdate(BaseModel):
    status: str  # PENDING, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED

class OrderItemResponse(BaseModel):
    id: int
    menu_item_id: int
    item_name: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    class Config:
        from_attributes = True

class PaymentResponse(BaseModel):
    id: int
    order_id: int
    amount: Decimal
    payment_method: str
    status: str
    transaction_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    user_id: int
    restaurant_id: int
    restaurant_name: Optional[str] = None
    total_amount: Decimal
    status: str
    delivery_address: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: List[OrderItemResponse] = []
    payment: Optional[PaymentResponse] = None

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_orders: int
    total_revenue: Decimal
    total_restaurants: int
    pending_orders: int

