"""
Paquete de middlewares de seguridad y control para la aplicación Flask.
Gestiona la inicialización y registro de: headers de seguridad HTTP, CORS y rate limiting.
"""

from app.middleware.security_headers import apply_security_headers
from app.middleware.cors import configure_cors
from app.middleware.rate_limiter import init_limiter

__all__ = ["init_middleware"]

__version__ = "1.0.0"
__author__ = "Equipo Validador RUT"


def init_middleware(app):
    apply_security_headers(app)
    configure_cors(app)
    init_limiter(app)