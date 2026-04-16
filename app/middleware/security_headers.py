from flask import request, current_app

X_CONTENT_TYPE_OPTIONS = "nosniff"
X_FRAME_OPTIONS = "DENY"
X_XSS_PROTECTION = "1; mode=block"
STRICT_TRANSPORT_SECURITY = "max-age=31536000; includeSubDomains"
REFERRER_POLICY = "strict-origin-when-cross-origin"
PERMISSIONS_POLICY = "geolocation=(), microphone=(), camera=()"
CACHE_CONTROL_API = "no-store, no-cache, must-revalidate"

CSP_DIRECTIVES = [
    ("default-src", "'self'"),
    ("script-src", "'self'"),
    ("style-src", "'self' 'unsafe-inline'"),
    ("img-src", "'self' data:"),
    ("font-src", "'self'"),
    ("connect-src", "'self'"),
    ("frame-ancestors", "'none'"),
]


def _build_csp() -> str:
    """
    Construye el valor del header Content-Security-Policy
    a partir de la lista de directivas definidas como constante.

    Returns:
        str: Cadena con todas las directivas CSP separadas por punto y coma.
    """
    return "; ".join(f"{directive} {value}" for directive, value in CSP_DIRECTIVES)


def _apply_security_headers(response):
    """
    Hook after_request que inyecta los headers de seguridad HTTP
    en cada respuesta saliente de la aplicación Flask.

    Aplica headers universales a todas las respuestas, headers condicionales
    según la ruta (Cache-Control para /api/) y headers dependientes del entorno
    (Strict-Transport-Security solo en producción).

    Args:
        response: Objeto de respuesta Flask que será modificado y retornado.

    Returns:
        response: El mismo objeto de respuesta con los headers de seguridad añadidos.
                  Nunca retorna None.
    """
    response.headers["X-Content-Type-Options"] = X_CONTENT_TYPE_OPTIONS
    response.headers["X-Frame-Options"] = X_FRAME_OPTIONS
    response.headers["X-XSS-Protection"] = X_XSS_PROTECTION
    response.headers["Content-Security-Policy"] = _build_csp()
    response.headers["Referrer-Policy"] = REFERRER_POLICY
    response.headers["Permissions-Policy"] = PERMISSIONS_POLICY

    if request.path.startswith("/api/"):
        response.headers["Cache-Control"] = CACHE_CONTROL_API

    flask_env = current_app.config.get("FLASK_ENV", "development")
    if flask_env == "production":
        response.headers["Strict-Transport-Security"] = STRICT_TRANSPORT_SECURITY

    return response


def init_security_headers(app) -> None:
    """
    Registra el middleware de headers de seguridad HTTP en la instancia
    de la aplicación Flask usando el hook after_request.

    Debe invocarse durante la inicialización de la aplicación (factory pattern)
    para garantizar que todas las respuestas incluyan los headers de seguridad
    sin necesidad de declararlos en cada endpoint individualmente.

    Args:
        app: Instancia de la aplicación Flask sobre la que se registrará el hook.

    Returns:
        None
    """
    app.after_request(_apply_security_headers)
    app.logger.info(
        "Security headers middleware inicializado correctamente. "
        "Headers activos: X-Content-Type-Options, X-Frame-Options, "
        "X-XSS-Protection, Content-Security-Policy, Referrer-Policy, "
        "Permissions-Policy. HSTS habilitado solo en producción."
    )