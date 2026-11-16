import os
import uuid
import logging
from decimal import Decimal
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import (
    engine, Base, get_db, check_database_connection,
    MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_DATABASE, logger
)
from .models import Restaurant, MenuItem, Order, OrderItem, Payment, OrderStatus, PaymentMethod, PaymentStatus
from .schemas import (
    RestaurantCreate, RestaurantResponse, RestaurantDetailResponse,
    MenuItemCreate, MenuItemResponse,
    OrderCreate, OrderResponse, OrderStatusUpdate,
    DashboardStats
)
from .auth_client import get_current_user_claims, require_admin

app = FastAPI(
    title="FoodRush Backend & Orders Microservice",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# Enable CORS for web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    logger.info("Initializing Backend Microservice...")
    connected, error = check_database_connection()
    if connected:
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Database schemas verified and ready.")
        except Exception as e:
            logger.warning(f"Could not auto-create schemas: {e}")
    else:
        logger.warning(
            "Backend started in degraded mode (Database is currently unreachable). "
            "Please check MySQL status."
        )

# =========================================================================
# HEALTH & DATABASE STATUS ENDPOINTS
# =========================================================================

@app.get("/health", tags=["Health"])
def health_check():
    connected, error = check_database_connection()
    return {
        "status": "healthy" if connected else "degraded",
        "service": "backend-service",
        "database": {
            "connected": connected,
            "host": MYSQL_HOST,
            "port": MYSQL_PORT,
            "database": MYSQL_DATABASE,
            "user": MYSQL_USER,
            "error": error
        }
    }

@app.get("/api/health/db", tags=["Health"])
def database_health_check():
    connected, error = check_database_connection()
    if not connected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "message": "Database is not connected",
                "host": MYSQL_HOST,
                "port": MYSQL_PORT,
                "database": MYSQL_DATABASE,
                "error": error
            }
        )
    return {
        "status": "connected",
        "host": MYSQL_HOST,
        "port": MYSQL_PORT,
        "database": MYSQL_DATABASE
    }

# =========================================================================
# RESTAURANTS & MENU CATALOG
# =========================================================================

@app.get("/api/restaurants", response_model=List[RestaurantResponse], tags=["Restaurants"])
def list_restaurants(
    cuisine: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Restaurant).filter(Restaurant.is_active == True)
    if cuisine:
        query = query.filter(Restaurant.cuisine.ilike(f"%{cuisine}%"))
    if search:
        query = query.filter(
            (Restaurant.name.ilike(f"%{search}%")) | (Restaurant.description.ilike(f"%{search}%"))
        )
    return query.all()

@app.get("/api/restaurants/{restaurant_id}", response_model=RestaurantDetailResponse, tags=["Restaurants"])
def get_restaurant_details(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    return restaurant

@app.get("/api/restaurants/{restaurant_id}/menu", response_model=List[MenuItemResponse], tags=["Restaurants"])
def get_restaurant_menu(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    return db.query(MenuItem).filter(
        MenuItem.restaurant_id == restaurant_id,
        MenuItem.is_available == True
    ).all()

# =========================================================================
# ORDERS, CART & PAYMENTS (ACID TRANSACTION)
# =========================================================================

@app.post("/api/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED, tags=["Orders"])
def create_order(
    order_in: OrderCreate,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    user_id = claims["user_id"]

    restaurant = db.query(Restaurant).filter(Restaurant.id == order_in.restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

    if not order_in.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must contain at least one item")

    total_amount = Decimal("0.00")
    order_items_to_create = []

    for item_input in order_in.items:
        menu_item = db.query(MenuItem).filter(
            MenuItem.id == item_input.menu_item_id,
            MenuItem.restaurant_id == order_in.restaurant_id
        ).first()

        if not menu_item or not menu_item.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Menu item ID {item_input.menu_item_id} is unavailable or does not belong to this restaurant"
            )

        subtotal = menu_item.price * item_input.quantity
        total_amount += subtotal

        order_items_to_create.append({
            "menu_item_id": menu_item.id,
            "item_name": menu_item.name,
            "quantity": item_input.quantity,
            "unit_price": menu_item.price,
            "subtotal": subtotal
        })

    pay_method = PaymentMethod.CARD
    if order_in.payment_method in [m.value for m in PaymentMethod]:
        pay_method = PaymentMethod(order_in.payment_method)

    try:
        new_order = Order(
            user_id=user_id,
            restaurant_id=restaurant.id,
            total_amount=total_amount,
            status=OrderStatus.CONFIRMED,
            delivery_address=order_in.delivery_address
        )
        db.add(new_order)
        db.flush()

        for item_data in order_items_to_create:
            order_item = OrderItem(
                order_id=new_order.id,
                menu_item_id=item_data["menu_item_id"],
                item_name=item_data["item_name"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                subtotal=item_data["subtotal"]
            )
            db.add(order_item)

        payment = Payment(
            order_id=new_order.id,
            amount=total_amount,
            payment_method=pay_method,
            status=PaymentStatus.SUCCESS,
            transaction_id=f"TXN-{uuid.uuid4().hex[:10].upper()}"
        )
        db.add(payment)

        db.commit()
        db.refresh(new_order)

        res = OrderResponse.model_validate(new_order)
        res.restaurant_name = restaurant.name
        logger.info(f"Order #{new_order.id} placed successfully by user {user_id}. Amount: ${total_amount}")
        return res

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to place order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Order creation failed: {str(e)}"
        )

@app.get("/api/orders", response_model=List[OrderResponse], tags=["Orders"])
def list_orders(
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    user_id = claims["user_id"]
    role = claims.get("role")

    query = db.query(Order)
    if role != "admin":
        query = query.filter(Order.user_id == user_id)

    orders = query.order_by(Order.created_at.desc()).all()
    results = []
    for o in orders:
        ord_dict = OrderResponse.model_validate(o)
        if o.restaurant:
            ord_dict.restaurant_name = o.restaurant.name
        results.append(ord_dict)
    return results

@app.get("/api/orders/{order_id}", response_model=OrderResponse, tags=["Orders"])
def get_order_tracking(
    order_id: int,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if claims.get("role") != "admin" and order.user_id != claims["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    res = OrderResponse.model_validate(order)
    if order.restaurant:
        res.restaurant_name = order.restaurant.name
    return res

@app.patch("/api/orders/{order_id}/status", response_model=OrderResponse, tags=["Orders"])
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    if claims.get("role") not in ["admin", "restaurant_owner"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins or restaurant managers can update status")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if status_update.status not in [s.value for s in OrderStatus]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status value: {status_update.status}")

    order.status = OrderStatus(status_update.status)
    db.commit()
    db.refresh(order)

    res = OrderResponse.model_validate(order)
    if order.restaurant:
        res.restaurant_name = order.restaurant.name
    logger.info(f"Order #{order_id} status updated to {status_update.status}")
    return res

# =========================================================================
# ADMIN API
# =========================================================================

@app.post("/api/admin/restaurants", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED, tags=["Admin"])
def create_restaurant(
    restaurant_in: RestaurantCreate,
    admin: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    restaurant = Restaurant(**restaurant_in.model_dump())
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    logger.info(f"Admin created restaurant: {restaurant.name} (id={restaurant.id})")
    return restaurant

@app.post("/api/admin/menu-items", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED, tags=["Admin"])
def create_menu_item(
    item_in: MenuItemCreate,
    admin: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == item_in.restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

    menu_item = MenuItem(**item_in.model_dump())
    db.add(menu_item)
    db.commit()
    db.refresh(menu_item)
    logger.info(f"Admin created menu item: {menu_item.name} for restaurant id={item_in.restaurant_id}")
    return menu_item

@app.get("/api/admin/dashboard", response_model=DashboardStats, tags=["Admin"])
def get_dashboard_stats(
    admin: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    total_revenue = db.query(func.sum(Order.total_amount)).scalar() or Decimal("0.00")
    total_restaurants = db.query(func.count(Restaurant.id)).scalar() or 0
    pending_orders = db.query(func.count(Order.id)).filter(
        Order.status.in_([OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.OUT_FOR_DELIVERY])
    ).scalar() or 0

    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "total_restaurants": total_restaurants,
        "pending_orders": pending_orders
    }
