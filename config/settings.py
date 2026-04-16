import os
import logging
from dotenv import load_dotenv, dotenv_values

load_dotenv()


class BaseConfig:
    _secret_key_value = os.environ.get('SECRET_KEY')
    if not _secret_key_value:
        raise ValueError(
            "La variable de entorno SECRET_KEY es obligatoria en producción. "
            "Define SECRET_KEY en tu archivo .env o en las variables de entorno del sistema. "
            "No uses valor por defecto inseguro."
        )
    SECRET_KEY = _secret_key_value

    DEBUG = False
    TESTING = False
    JSON_SORT_KEYS = False

    _cors_origins_env = os.environ.get('CORS_ORIGINS')
    CORS_ORIGINS = (
        [origin.strip() for origin in _cors_origins_env.split(',')]
        if _cors_origins_env
        else ['http://localhost:5000']
    )
    CORS_METHODS = ['GET', 'POST']

    RATELIMIT_DEFAULT = os.environ.get('RATELIMIT_DEFAULT', '100 per hour')
    RATELIMIT_STORAGE_URL = os.environ.get('RATELIMIT_STORAGE_URL', 'memory://')
    RATELIMIT_HEADERS_ENABLED = True

    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_DIR = 'logs/'
    LOG_FILENAME = 'audit.log'
    LOG_MAX_BYTES = 10 * 1024 * 1024
    LOG_BACKUP_COUNT = 5
    LOG_FORMAT = (
        '%(asctime)s | %(levelname)s | %(name)s | '
        'ip=%(ip)s | %(message)s'
    )

    SECURITY_HEADERS = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': "default-src 'self'",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
    }

    RUT_REGEX = r'^\d{7,8}-[\dkK]$'
    RUT_MAX_LENGTH = 12


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-only-insecure-key')
    LOG_LEVEL = 'DEBUG'

    SECURITY_HEADERS = {
        **BaseConfig.SECURITY_HEADERS,
        'Content-Security-Policy': "default-src 'self' 'unsafe-inline'",
    }


class ProductionConfig(BaseConfig):
    DEBUG = False
    RATELIMIT_DEFAULT = os.environ.get('RATELIMIT_DEFAULT', '30 per hour')

    @classmethod
    def validate(cls):
        if cls.SECRET_KEY == 'dev-only-insecure-key':
            raise ValueError(
                "SECRET_KEY tiene el valor inseguro de desarrollo. "
                "Define una SECRET_KEY segura y única para el entorno de producción."
            )


class TestingConfig(BaseConfig):
    TESTING = True
    DEBUG = True
    SECRET_KEY = 'testing-secret-key'
    RATELIMIT_ENABLED = False
    LOG_LEVEL = 'WARNING'


config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig,
}


def get_config(env_name: str = None):
    if env_name is None:
        env_name = os.environ.get('FLASK_ENV', 'development')

    config_class = config_map.get(env_name)

    if config_class is None:
        logging.warning(
            "Entorno '%s' no encontrado en config_map. "
            "Usando DevelopmentConfig como fallback.",
            env_name,
        )
        return DevelopmentConfig

    return config_class