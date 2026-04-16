from flask import Blueprint, request, jsonify
import logging
import re

from app.extensions import limiter
from app.services.rut_service import validate_rut_service
from app.utils.audit_logger import audit_logger

rut_bp = Blueprint("rut_routes", __name__)

logger = logging.getLogger(__name__)

RUT_REGEX = re.compile(r"^\d{1,8}-[\dKk]$")


@rut_bp.route("/validate-rut", methods=["POST"])
@limiter.limit("10 per minute")
def validate_rut():
    payload = request.get_json(silent=True)

    if payload is None or "rut" not in payload:
        return (
            jsonify(
                {
                    "valid": False,
                    "message": "El cuerpo de la solicitud debe ser JSON y contener el campo 'rut'.",
                    "rut_formateado": "",
                }
            ),
            400,
        )

    rut_raw = payload["rut"]

    if not isinstance(rut_raw, str):
        rut_raw = str(rut_raw)

    rut_stripped = rut_raw.strip()

    if rut_stripped == "":
        return (
            jsonify(
                {
                    "valid": False,
                    "message": "El campo 'rut' no puede estar vacío.",
                    "rut_formateado": "",
                }
            ),
            400,
        )

    if not RUT_REGEX.match(rut_stripped):
        audit_logger.warning(
            "Formato de RUT inválido recibido | IP: %s | Payload: %s",
            request.remote_addr,
            rut_stripped,
        )
        logger.warning(
            "Formato de RUT inválido recibido desde IP %s: '%s'",
            request.remote_addr,
            rut_stripped,
        )
        return (
            jsonify(
                {
                    "valid": False,
                    "message": (
                        "Formato de RUT inválido. El formato esperado es: "
                        "12345678-9 o 12345678-K (sin puntos, con guion)."
                    ),
                    "rut_formateado": "",
                }
            ),
            400,
        )

    try:
        result = validate_rut_service(rut_stripped)

        if not result.get("valid", False):
            audit_logger.info(
                "RUT inválido (dígito verificador incorrecto) | IP: %s | RUT: %s | Motivo: %s",
                request.remote_addr,
                rut_stripped,
                result.get("message", "Dígito verificador incorrecto"),
            )

        return jsonify(result), 200

    except Exception:
        logger.error(
            "Error inesperado al procesar la validación del RUT '%s' desde IP %s",
            rut_stripped,
            request.remote_addr,
            exc_info=True,
        )
        return (
            jsonify(
                {
                    "valid": False,
                    "message": "Error interno del servidor. Por favor, intente nuevamente más tarde.",
                    "rut_formateado": "",
                }
            ),
            500,
        )