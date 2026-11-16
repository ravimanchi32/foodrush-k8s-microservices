import time
from fastapi import FastAPI, Depends, HTTPException, status, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from .database import engine, Base, get_db, check_database_connection, MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER, logger
from .models import User, UserRole
from .schemas import UserRegister, UserLogin, UserResponse, TokenResponse, TokenVerifyResponse
from .auth import hash_password, verify_password, create_access_token, decode_access_token, security

app = FastAPI(
    title="FoodRush Auth Microservice",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# Enable CORS for frontend and inter-service access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_db():
    logger.info("Initializing Auth Microservice...")
    connected, error = check_database_connection()
    if connected:
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("Auth schemas verified and ready.")
        except Exception as e:
            logger.warning(f"Could not auto-create auth schemas: {e}")
    else:
        logger.warning("Auth service started in degraded mode (Database unreachable).")

@app.get("/health", tags=["Health"])
def health_check():
    connected, error = check_database_connection()
    return {
        "status": "healthy" if connected else "degraded",
        "service": "auth-service",
        "database": {
            "connected": connected,
            "host": MYSQL_HOST,
            "port": MYSQL_PORT,
            "database": MYSQL_DATABASE,
            "user": MYSQL_USER,
            "error": error
        }
    }

@app.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, tags=["Auth"])
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Validate role
    role = UserRole.customer
    if user_in.role and user_in.role in [r.value for r in UserRole]:
        role = UserRole(user_in.role)

    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        role=role,
        phone=user_in.phone,
        address=user_in.address
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email, "role": new_user.role.value})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }

@app.post("/auth/login", response_model=TokenResponse, tags=["Auth"])
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role.value})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header"
        )
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@app.get("/auth/verify", response_model=TokenVerifyResponse, tags=["Auth"])
def verify_token(credentials: HTTPAuthorizationCredentials = Security(security), db: Session = Depends(get_db)):
    if not credentials:
        return {"valid": False, "user": None}
    try:
        user = get_current_user_from_token(credentials, db)
        return {"valid": True, "user": user}
    except HTTPException:
        return {"valid": False, "user": None}

@app.get("/auth/me", response_model=UserResponse, tags=["Auth"])
def get_current_user_profile(user: User = Depends(get_current_user_from_token)):
    return user

