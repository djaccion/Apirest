import re
import unicodedata

RUT_PATTERN = re.compile(r'^\d{1,8}-[\dKk]$')

MAX_RUT_LENGTH = 10

MIN_RUT_LENGTH = 3


def sanitize_rut(rut):
    """Sanitiza y normaliza un string de RUT chileno.

    Args:
        rut: Valor de entrada a sanitizar. Debe ser un string con formato RUT chileno.

    Returns:
        str: String sanitizado, en mayúsculas, sin puntos y con formato dígitos-guion-verificador.

    Raises:
        TypeError: Si el parámetro recibido no es una instancia de string.
        ValueError: Si la longitud del string no cumple con los rangos permitidos.
        ValueError: Si el string no coincide con el formato esperado de RUT chileno.
    """
    if not isinstance(rut, str):
        raise TypeError("Se esperaba un string como entrada para el RUT.")

    rut = unicodedata.normalize("NFKC", rut)

    rut = rut.strip()

    if not (MIN_RUT_LENGTH <= len(rut) <= MAX_RUT_LENGTH):
        raise ValueError(
            f"Longitud inválida para el RUT. Se esperan entre {MIN_RUT_LENGTH} y {MAX_RUT_LENGTH} caracteres."
        )

    rut = rut.replace(".", "")

    rut = rut.upper()

    if not RUT_PATTERN.fullmatch(rut):
        raise ValueError(
            "Formato de RUT inválido. El formato esperado es: dígitos-dígito_verificador (ejemplo: 12345678-9 o 12345678-K)."
        )

    return rut


def split_rut(rut):
    """Separa un RUT sanitizado en su cuerpo numérico y dígito verificador.

    Args:
        rut (str): String de RUT ya sanitizado proveniente de sanitize_rut,
            con formato dígitos-guion-verificador.

    Returns:
        tuple: Tupla de dos elementos (cuerpo, verificador) donde cuerpo es el
            string numérico antes del guion y verificador es el string de un
            carácter después del guion.
    """
    cuerpo, verificador = rut.split("-")
    return cuerpo, verificador


def format_rut(rut):
    """Formatea un RUT sanitizado con puntos de miles para presentación al usuario.

    Args:
        rut (str): String de RUT ya sanitizado proveniente de sanitize_rut,
            con formato dígitos-guion-verificador.

    Returns:
        str: RUT formateado con puntos de miles en el cuerpo numérico,
            por ejemplo: 12.345.678-9.
    """
    cuerpo, verificador = split_rut(rut)

    cuerpo_invertido = cuerpo[::-1]
    grupos = [cuerpo_invertido[i:i+3] for i in range(0, len(cuerpo_invertido), 3)]
    cuerpo_formateado = ".".join(grupos)[::-1]

    return f"{cuerpo_formateado}-{verificador}"