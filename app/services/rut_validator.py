import re
import logging

logger = logging.getLogger(__name__)

RUT_REGEX = re.compile(r'^\d{1,8}-[\dKk]$')
SECUENCIA_MULTIPLICADORES = (2, 3, 4, 5, 6, 7)


class RutValidator:

    @staticmethod
    def sanitizar_rut(rut_crudo: str) -> str:
        rut = rut_crudo.strip()
        rut = rut.upper()
        rut = rut.replace('.', '')
        return rut

    @staticmethod
    def validar_formato(rut_sanitizado: str) -> bool:
        return bool(RUT_REGEX.match(rut_sanitizado))

    @staticmethod
    def calcular_digito_verificador(parte_numerica: str) -> str:
        digitos = [int(d) for d in parte_numerica]
        digitos.reverse()
        suma = 0
        for i, digito in enumerate(digitos):
            multiplicador = SECUENCIA_MULTIPLICADORES[i % 6]
            suma += digito * multiplicador
        resto = suma % 11
        if resto == 0:
            return '0'
        elif resto == 1:
            return 'K'
        else:
            return str(11 - resto)

    @staticmethod
    def formatear_rut(parte_numerica: str, digito_verificador: str) -> str:
        numero = int(parte_numerica)
        numero_formateado = f'{numero:,}'.replace(',', '.')
        return f'{numero_formateado}-{digito_verificador}'

    @staticmethod
    def validar(rut_crudo: str) -> dict:
        try:
            rut_sanitizado = RutValidator.sanitizar_rut(rut_crudo)

            if not RutValidator.validar_formato(rut_sanitizado):
                logger.warning(
                    'Formato de RUT inválido recibido: %s', rut_sanitizado
                )
                return {
                    'valid': False,
                    'message': 'El formato del RUT es incorrecto. Use el formato XXXXXXXX-X.',
                    'rut_formateado': None
                }

            partes = rut_sanitizado.split('-')
            parte_numerica = partes[0]
            digito_ingresado = partes[1]

            digito_calculado = RutValidator.calcular_digito_verificador(parte_numerica)

            if digito_ingresado != digito_calculado:
                logger.warning(
                    'Dígito verificador incorrecto para RUT: %s', rut_sanitizado
                )
                return {
                    'valid': False,
                    'message': 'El dígito verificador es incorrecto.',
                    'rut_formateado': None
                }

            rut_formateado = RutValidator.formatear_rut(parte_numerica, digito_calculado)
            return {
                'valid': True,
                'message': 'El RUT es válido.',
                'rut_formateado': rut_formateado
            }

        except Exception as e:
            logger.error('Error inesperado al validar RUT: %s', str(e))
            return {
                'valid': False,
                'message': 'Error interno al procesar el RUT.',
                'rut_formateado': None
            }