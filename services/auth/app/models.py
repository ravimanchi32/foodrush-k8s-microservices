from sqlalchemy import Column, Integer, String, Enum, Text, DateTime, func
from .database import Base
import enum

class UserRole(str, enum.Enum):
    customer = "customer"
    admin = "admin"
    restaurant_owner = "restaurant_owner"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.customer, nullable=False)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

