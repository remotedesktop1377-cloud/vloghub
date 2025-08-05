"""
Database configuration and session management.
"""
import os
import logging
from typing import Generator
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:password@localhost:5432/youtube_clip_searcher"
)

# For testing, use SQLite in memory
if os.getenv("TESTING"):
    DATABASE_URL = "sqlite:///:memory:"

# Create engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
        echo=os.getenv("DATABASE_ECHO", "false").lower() == "true"
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=os.getenv("DATABASE_ECHO", "false").lower() == "true"
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base for declarative models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Get database session.
    
    Yields:
        Database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all database tables."""
    try:
        # Import models to register them
        from src.models.metadata import Base as MetadataBase
        
        # Create tables
        MetadataBase.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise


def drop_tables():
    """Drop all database tables."""
    try:
        from src.models.metadata import Base as MetadataBase
        
        MetadataBase.metadata.drop_all(bind=engine)
        logger.info("Database tables dropped successfully")
        
    except Exception as e:
        logger.error(f"Error dropping database tables: {e}")
        raise


def init_database():
    """Initialize database with default data."""
    try:
        from src.services.metadata.tag_service import TagService
        from src.models.metadata import TagType
        
        with SessionLocal() as db:
            tag_service = TagService(db)
            
            # Create default tag categories
            default_categories = [
                {"name": "People", "description": "Historical figures and speakers", "color": "#2196F3"},
                {"name": "Locations", "description": "Geographic locations", "color": "#4CAF50"},
                {"name": "Events", "description": "Historical events and occasions", "color": "#FF9800"},
                {"name": "Topics", "description": "Subject matter and themes", "color": "#9C27B0"},
                {"name": "Sentiments", "description": "Emotional tone and mood", "color": "#F44336"},
                {"name": "Organizations", "description": "Institutions and groups", "color": "#607D8B"},
            ]
            
            for category_data in default_categories:
                try:
                    tag_service.create_tag_category(**category_data)
                except Exception as e:
                    logger.warning(f"Category already exists or error: {e}")
            
            # Create some default tags
            default_tags = [
                {"name": "Nelson Mandela", "tag_type": TagType.PERSON},
                {"name": "South Africa", "tag_type": TagType.LOCATION},
                {"name": "Apartheid", "tag_type": TagType.EVENT},
                {"name": "Freedom", "tag_type": TagType.TOPIC},
                {"name": "Inspiring", "tag_type": TagType.SENTIMENT},
                {"name": "African National Congress", "tag_type": TagType.ORGANIZATION},
            ]
            
            for tag_data in default_tags:
                try:
                    tag_service.create_tag(**tag_data)
                except Exception as e:
                    logger.warning(f"Tag already exists or error: {e}")
            
            logger.info("Database initialized with default data")
            
    except Exception as e:
        logger.error(f"Error initializing database: {e}")


class DatabaseManager:
    """Database management utilities."""
    
    @staticmethod
    def health_check() -> bool:
        """
        Check database connectivity.
        
        Returns:
            True if database is accessible.
        """
        try:
            with engine.connect() as connection:
                connection.execute("SELECT 1")
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    @staticmethod
    def get_connection_info() -> dict:
        """Get database connection information."""
        return {
            "url": DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL,
            "driver": engine.dialect.name,
            "pool_size": engine.pool.size() if hasattr(engine.pool, 'size') else None,
            "checked_out": engine.pool.checkedout() if hasattr(engine.pool, 'checkedout') else None,
        }
    
    @staticmethod 
    def backup_database(backup_path: str) -> bool:
        """
        Create database backup.
        
        Args:
            backup_path: Path for backup file.
            
        Returns:
            True if backup successful.
        """
        try:
            # This is a simplified backup - in production you'd use pg_dump or similar
            if DATABASE_URL.startswith("sqlite"):
                import shutil
                db_path = DATABASE_URL.replace("sqlite:///", "")
                if db_path != ":memory:":
                    shutil.copy2(db_path, backup_path)
                    return True
            
            logger.warning("Backup not implemented for this database type")
            return False
            
        except Exception as e:
            logger.error(f"Database backup failed: {e}")
            return False 