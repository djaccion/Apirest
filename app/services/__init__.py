"""
Paquete de servicios: contiene la capa de lógica de negocio del sistema,
específicamente los servicios de validación de RUT chileno mediante el algoritmo módulo 11.
"""

from .rut_service import validate_rut, format_rut

__all__ = ["validate_rut", "format_rut"]