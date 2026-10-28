"""
PhishGuard - Configuration Module
Manages application settings, database paths, and model configurations across environments.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file if available
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


class Config:
    """Base application configuration."""
    SECRET_KEY = os.getenv("SECRET_KEY", "phishguard-insecure-dev-key-change-in-production")
    DATABASE_PATH = os.getenv(
        "DATABASE_PATH",
        str(BASE_DIR / "phishguard.db")
    )
    MODEL_PATH = os.getenv(
        "MODEL_PATH",
        str(BASE_DIR / "model" / "phishguard_model.joblib")
    )
    MAX_URL_LENGTH = int(os.getenv("MAX_URL_LENGTH", 2048))
    ALLOWED_SCHEMES = ("http", "https")
    ITEMS_PER_PAGE = 20

    # ML Inference Thresholds
    ML_HIGH_RISK_THRESHOLD = 0.70
    ML_MED_RISK_THRESHOLD = 0.35

    # Security settings
    WTF_CSRF_ENABLED = True


class DevelopmentConfig(Config):
    """Development environment settings."""
    DEBUG = True
    TESTING = False


class TestingConfig(Config):
    """Testing environment settings."""
    DEBUG = False
    TESTING = True
    DATABASE_PATH = str(BASE_DIR / "test_phishguard.db")
    SECRET_KEY = "test-secret-key"


class ProductionConfig(Config):
    """Production environment settings."""
    DEBUG = False
    TESTING = False
    SECRET_KEY = os.getenv("SECRET_KEY")


# Configuration mapping
config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig,
}


def get_config():
    """Retrieve the configuration class based on FLASK_ENV or default to development."""
    env = os.getenv("FLASK_ENV", "development").lower()
    return config_by_name.get(env, DevelopmentConfig)
