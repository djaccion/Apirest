import os
import logging
from logging.handlers import RotatingFileHandler
from flask import Flask, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv


def _configure_logging(app):
    audit_log_path = app.config.get("AUDIT_LOG_PATH", "logs/audit.log")
    log_dir = os.path.dirname(audit_log_path)

    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir, exist_ok=True)

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S"
    )

    file_handler = RotatingFileHandler(
        audit_log_path,
        maxBytes=5 * 1024 * 1024,
        backupCount=5
    )
    file_handler.setFormatter(formatter)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)

    log_level_name = app.config.get("LOG_LEVEL", "INFO")
    log_level = logging.getLevelName(log_level_name)

    app.logger.setLevel(log_level)
    app.logger.addHandler(file_handler)
    app.logger.addHandler(stream_handler)

    app.logger.info(
        "Aplicación inicializada correctamente | Entorno: %s",
        app.config.get("FLASK_ENV", "development")
    )


def create_app(config=None):
    load_dotenv()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    template_folder = os.path.join(base_dir, "..", "templates")
    static_folder = os.path.join(base_dir, "..", "static")

    app = Flask(
        __name__,
        template_folder=os.path.abspath(template_folder),
        static_folder=os.path.abspath(static_folder)
    )

    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        secret_key = "dev-insecure-secret-key-change-in-production"
        logging.warning(
            "SECRET_KEY no definida en el entorno. Usando clave insegura solo para desarrollo."
        )

    flask_env = os.getenv("FLASK_ENV", "development")

    allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5000")
    allowed_origins = [
        origin.strip()
        for origin in allowed_origins_raw.split(",")
        if origin.strip()
    ]

    ratelimit_default = os.getenv("RATELIMIT_DEFAULT", "100 per hour")
    log_level = os.getenv("LOG_LEVEL", "INFO")
    audit_log_path = os.getenv("AUDIT_LOG_PATH", "logs/audit.log")

    app.config["SECRET_KEY"] = secret_key
    app.config["FLASK_ENV"] = flask_env
    app.config["ALLOWED_ORIGINS"] = allowed_origins
    app.config["RATELIMIT_DEFAULT"] = ratelimit_default
    app.config["LOG_LEVEL"] = log_level
    app.config["AUDIT_LOG_PATH"] = audit_log_path

    if config is not None:
        if isinstance(config, dict):
            app.config.update(config)
        else:
            app.config.from_object(config)

    _configure_logging(app)

    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=[app.config["RATELIMIT_DEFAULT"]],
        storage_uri="memory://"
    )
    limiter.init_app(app)

    @app.after_request
    def apply_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        if app.config.get("FLASK_ENV") == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        origin = request.headers.get("Origin")
        if origin and origin in app.config["ALLOWED_ORIGINS"]:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type"

        return response

    @app.errorhandler(400)
    def bad_request(error):
        from flask import jsonify
        app.logger.warning(
            "400 Bad Request | IP: %s | Path: %s | Error: %s",
            request.remote_addr,
            request.path,
            str(error)
        )
        return jsonify({
            "error": "Bad Request",
            "message": str(error.description) if hasattr(error, "description") else "Solicitud inválida.",
            "status_code": 400
        }), 400

    @app.errorhandler(404)
    def not_found(error):
        from flask import jsonify
        app.logger.warning(
            "404 Not Found | IP: %s | Path: %s",
            request.remote_addr,
            request.path
        )
        return jsonify({
            "error": "Not Found",
            "message": "El recurso solicitado no existe.",
            "status_code": 404
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        from flask import jsonify
        app.logger.warning(
            "405 Method Not Allowed | IP: %s | Path: %s | Method: %s",
            request.remote_addr,
            request.path,
            request.method
        )
        return jsonify({
            "error": "Method Not Allowed",
            "message": "El método HTTP utilizado no está permitido para este endpoint.",
            "status_code": 405
        }), 405

    @app.errorhandler(429)
    def too_many_requests(error):
        from flask import jsonify
        app.logger.warning(
            "429 Too Many Requests | IP: %s | Path: %s",
            request.remote_addr,
            request.path
        )
        return jsonify({
            "error": "Too Many Requests",
            "message": "Has excedido el límite de solicitudes permitidas. Intenta más tarde.",
            "status_code": 429
        }), 429

    @app.errorhandler(500)
    def internal_server_error(error):
        from flask import jsonify
        app.logger.error(
            "500 Internal Server Error | IP: %s | Path: %s | Error: %s",
            request.remote_addr,
            request.path,
            str(error)
        )
        return jsonify({
            "error": "Internal Server Error",
            "message": "Ocurrió un error interno en el servidor.",
            "status_code": 500
        }), 500

    from app.routes.rut_routes import rut_bp
    app.register_blueprint(rut_bp, url_prefix="/api")

    return app