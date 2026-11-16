import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import OperationalError, SQLAlchemyError

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s"
)
logger = logging.getLogger("backend.database")

load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST", "mysql-service")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "fooduser")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "foodpassword")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "food_delivery")

DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"

logger.info(f"Configuring Database Engine for host='{MYSQL_HOST}:{MYSQL_PORT}', db='{MYSQL_DATABASE}', user='{MYSQL_USER}'")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args={"connect_timeout": 5}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def check_database_connection():
    """Checks whether MySQL is reachable and prints descriptive logs."""
    try:
        logger.info(f"Testing MySQL connection to {MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}...")
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Database connection successful! Connected to '{MYSQL_DATABASE}' on '{MYSQL_HOST}:{MYSQL_PORT}'.")
        return True, None
    except OperationalError as e:
        error_msg = f"Cannot reach MySQL on '{MYSQL_HOST}:{MYSQL_PORT}'. Error: {e.orig if hasattr(e, 'orig') else str(e)}"
        logger.error(f"Database connection failed: {error_msg}")
        logger.warning(
            "Troubleshooting Tips:\n"
            "  1. Is MySQL running? If using Docker, run: docker compose up -d mysql-service\n"
            f"  2. Check host and port: MYSQL_HOST='{MYSQL_HOST}', MYSQL_PORT='{MYSQL_PORT}'\n"
            f"  3. Check credentials: MYSQL_USER='{MYSQL_USER}', MYSQL_DATABASE='{MYSQL_DATABASE}'"
        )
        return False, error_msg
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Unexpected database connection error: {error_msg}")
        return False, error_msg

def get_db():
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database query error occurred: {str(e)}")
        raise
    finally:
        db.close()
