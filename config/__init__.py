import os
from dotenv import load_dotenv
from config.settings import DevelopmentConfig, TestingConfig, ProductionConfig

load_dotenv()

CONFIG_VERSION = "1.0.0"

__all__ = ["get_config", "CONFIG_VERSION"]


def get_config():
    env = os.environ.get("FLASK_ENV", "production")
    if env == "development":
        return DevelopmentConfig
    elif env == "testing":
        return TestingConfig
    else:
        return ProductionConfig