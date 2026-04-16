"""
Paquete de utilidades del sistema de validación de RUT chileno.

Agrupa los módulos internos responsables de:
- Validación del algoritmo módulo 11 para RUT chileno (rut_validator)
- Auditoría y registro de intentos de validación inválidos (audit_logger)

Actúa como punto único de importación para las capas superiores de la aplicación,
exponiendo únicamente los símbolos públicos necesarios sin revelar la estructura
interna de archivos del paquete.
"""

__version__ = "1.0.0"
__author__ = "Equipo Validador RUT"

from .rut_validator import validate_rut
from .audit_logger import log_invalid_attempt

__all__ = [
    "validate_rut",
    "log_invalid_attempt",
]