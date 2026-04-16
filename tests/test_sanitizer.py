import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.sanitizer import sanitize_rut

pytestmark = pytest.mark.unit


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def valid_ruts():
    return [
        ("12345678-9", "12345678-9"),
        ("12345678-K", "12345678-K"),
        ("12345678-k", "12345678-K"),
        ("12.345.678-9", "12345678-9"),
        ("1-9", "1-9"),
    ]


@pytest.fixture
def malicious_payloads():
    return [
        "1'; DROP TABLE--",
        "<script>alert(1)</script>",
        "& ' \" < >",
        "12345678\x00-9",
        "12345678\n-9",
        "12345678\r-9",
        "A" * 501,
        "12345678-\u00e9",
        "12345678-\u4e2d",
    ]


@pytest.fixture
def invalid_formats():
    return [
        "",
        "   ",
        "1234A678-9",
        "1234--5678-9",
        "-12345678",
        "12345678-",
        "12345678-9K",
        "abcdefgh",
    ]


# ---------------------------------------------------------------------------
# Clase: Entradas Válidas
# ---------------------------------------------------------------------------

class TestEntradasValidas:

    @pytest.mark.unit
    def test_rut_formato_estandar_digito_numerico(self):
        ok, result = sanitize_rut("12345678-9")
        assert ok is True
        assert result == "12345678-9"

    @pytest.mark.unit
    def test_rut_digito_verificador_k_mayuscula(self):
        ok, result = sanitize_rut("12345678-K")
        assert ok is True
        assert result == "12345678-K"

    @pytest.mark.unit
    def test_rut_digito_verificador_k_minuscula_normalizado(self):
        ok, result = sanitize_rut("12345678-k")
        assert ok is True
        assert result == "12345678-K"

    @pytest.mark.unit
    def test_rut_con_puntos_de_miles_limpiado(self):
        ok, result = sanitize_rut("12.345.678-9")
        assert ok is True
        assert result == "12345678-9"
        assert "." not in result

    @pytest.mark.unit
    def test_rut_minimo_valido_una_cifra(self):
        ok, result = sanitize_rut("1-9")
        assert ok is True
        assert result == "1-9"

    @pytest.mark.unit
    @pytest.mark.parametrize("rut_input,expected", [
        ("12345678-9", "12345678-9"),
        ("12345678-K", "12345678-K"),
        ("12345678-k", "12345678-K"),
        ("12.345.678-9", "12345678-9"),
        ("1-9", "1-9"),
    ])
    def test_ruts_validos_parametrizados(self, rut_input, expected):
        ok, result = sanitize_rut(rut_input)
        assert ok is True
        assert result == expected
        assert "." not in result

    @pytest.mark.unit
    def test_rut_formato_canonico_sin_puntos(self):
        ok, result = sanitize_rut("1.234.567-8")
        assert ok is True
        assert "." not in result
        assert "-" in result

    @pytest.mark.unit
    def test_rut_k_en_resultado_siempre_mayuscula(self):
        ok, result = sanitize_rut("5126663-k")
        assert ok is True
        assert result.endswith("-K")


# ---------------------------------------------------------------------------
# Clase: Formato Inválido
# ---------------------------------------------------------------------------

class TestFormatoInvalido:

    @pytest.mark.unit
    def test_cadena_vacia(self):
        ok, result = sanitize_rut("")
        assert ok is False
        assert result is not None
        assert result != ""

    @pytest.mark.unit
    def test_solo_espacios_en_blanco(self):
        ok, result = sanitize_rut("   ")
        assert ok is False
        assert result is not None

    @pytest.mark.unit
    def test_letras_en_parte_numerica(self):
        ok, result = sanitize_rut("1234A678-9")
        assert ok is False

    @pytest.mark.unit
    def test_doble_guion(self):
        ok, result = sanitize_rut("1234--5678-9")
        assert ok is False

    @pytest.mark.unit
    def test_guion_al_inicio(self):
        ok, result = sanitize_rut("-12345678")
        assert ok is False

    @pytest.mark.unit
    def test_guion_al_final_sin_digito_verificador(self):
        ok, result = sanitize_rut("12345678-")
        assert ok is False

    @pytest.mark.unit
    def test_multiples_digitos_verificadores(self):
        ok, result = sanitize_rut("12345678-9K")
        assert ok is False

    @pytest.mark.unit
    def test_solo_letras_sin_numeros(self):
        ok, result = sanitize_rut("abcdefgh")
        assert ok is False

    @pytest.mark.unit
    @pytest.mark.parametrize("rut_invalido", [
        "",
        "   ",
        "1234A678-9",
        "1234--5678-9",
        "-12345678",
        "12345678-",
        "12345678-9K",
        "abcdefgh",
    ])
    def test_formatos_invalidos_parametrizados(self, rut_invalido):
        ok, result = sanitize_rut(rut_invalido)
        assert ok is False
        assert result is not None
        assert isinstance(result, str)
        assert len(result) > 0


# ---------------------------------------------------------------------------
# Clase: Protección contra Inyecciones y XSS
# ---------------------------------------------------------------------------

class TestProteccionInyeccionesXSS:

    @pytest.mark.unit
    @pytest.mark.security
    def test_inyeccion_sql_basica(self):
        ok, result = sanitize_rut("1'; DROP TABLE--")
        assert ok is False

    @pytest.mark.unit
    @pytest.mark.security
    def test_script_tag_html(self):
        ok, result = sanitize_rut("<script>alert(1)</script>")
        assert ok is False

    @pytest.mark.unit
    @pytest.mark.security
    def test_caracteres_especiales_ampersand_comillas_angulares(self):
        ok, result = sanitize_rut("& ' \" < >")
        assert ok is False

    @pytest.mark.unit
    @pytest.mark.security
    def test_null_byte_en_cadena(self):
        ok, result = sanitize_rut("12345678\x00-9")
        assert ok is False

    @pytest.mark.unit
    @pytest.mark.security
    def test_salto_de_linea_en_cadena(self):
        ok, result = sanitize_rut("12345678\n-9")
        assert ok is False

    @pytest.mark.unit
    @pytest.mark.security
    def test_retorno_de_carro_en_cadena(self):
        ok, result = sanitize_rut("12345678\r-9")
        assert ok is False

    @pytest.mark.unit
    @pytest.mark.security
    def test_payload_longitud_extrema(self):
        payload = "1" * 501
        ok, result = sanitize_rut(payload)
        assert ok is False

    @pytest.mark.unit
    @pytest.mark.security
    def test_caracteres_unicode_fuera_ascii(self):
        ok, result = sanitize_rut("12345678-\u00e9")
        assert ok is False

    @pytest.mark.unit
    @pytest.mark.security
    def test_caracteres_unicode_chino(self):
        ok, result = sanitize_rut("12345678-\u4e2d")
        assert ok is False

    @pytest.mark.unit
    @pytest.mark.security
    @pytest.mark.parametrize("payload", [
        "1'; DROP TABLE--",
        "<script>alert(1)</script>",
        "& ' \" < >",
        "12345678\x00-9",
        "12345678\n-9",
        "12345678\r-9",
        "A" * 501,
        "12345678-\u00e9",
        "12345678-\u4e2d",
        "javascript:alert(1)",
        "{{7*7}}",
        "${7*7}",
        "'; EXEC xp_cmdshell('dir')--",
        "<img src=x onerror=alert(1)>",
        "\\x3cscript\\x3e",
    ])
    def test_payloads_maliciosos_parametrizados(self, payload):
        ok, result = sanitize_rut(payload)
        assert ok is False
        assert isinstance(result, str)
        assert len(result) > 0

    @pytest.mark.unit
    @pytest.mark.security
    def test_resultado_no_contiene_payload_original_en_exito_falso(self):
        payload = "<script>alert(1)</script>"
        ok, result = sanitize_rut(payload)
        assert ok is False
        assert "<script>" not in result


# ---------------------------------------------------------------------------
# Clase: Casos Límite
# ---------------------------------------------------------------------------

class TestCasosLimite:

    @pytest.mark.unit
    def test_entrada_none(self):
        ok, result = sanitize_rut(None)
        assert ok is False
        assert isinstance(result, str)

    @pytest.mark.unit
    def test_entrada_tipo_entero(self):
        ok, result = sanitize_rut(123456789)
        assert ok is False
        assert isinstance(result, str)

    @pytest.mark.unit
    def test_entrada_tipo_lista(self):
        ok, result = sanitize_rut(["12345678-9"])
        assert ok is False
        assert isinstance(result, str)

    @pytest.mark.unit
    def test_entrada_tipo_diccionario(self):
        ok, result = sanitize_rut({"rut": "12345678-9"})
        assert ok is False
        assert isinstance(result, str)

    @pytest.mark.unit
    def test_rut_con_espacios_internos(self):
        ok, result = sanitize_rut("123 456 78-9")
        assert ok is False

    @pytest.mark.unit
    def test_rut_con_tabulaciones(self):
        ok, result = sanitize_rut("12345678\t-9")
        assert ok is False

    @pytest.mark.unit
    def test_rut_con_ceros_a_la_izquierda(self):
        ok, result = sanitize_rut("00012345678-9")
        assert ok is False

    @pytest.mark.unit
    @pytest.mark.parametrize("entrada_invalida", [
        None,
        123456789,
        ["12345678-9"],
        {"rut": "12345678-9"},
        ("12345678-9",),
        True,
        False,
        3.14,
    ])
    def test_tipos_no_string_parametrizados(self, entrada_invalida):
        ok, result = sanitize_rut(entrada_invalida)
        assert ok is False
        assert isinstance(result, str)
        assert len(result) > 0

    @pytest.mark.unit
    def test_rut_con_espacios_al_inicio_y_final_no_valido(self):
        ok, result = sanitize_rut("  12345678-9  ")
        assert ok is False

    @pytest.mark.unit
    def test_rut_solo_guion(self):
        ok, result = sanitize_rut("-")
        assert ok is False

    @pytest.mark.unit
    def test_rut_solo_k(self):
        ok, result = sanitize_rut("K")
        assert ok is False


# ---------------------------------------------------------------------------
# Clase: Validación de Longitud
# ---------------------------------------------------------------------------

class TestValidacionLongitud:

    @pytest.mark.unit
    def test_longitud_minima_permitida(self):
        rut_minimo = "1-9"
        ok, result = sanitize_rut(rut_minimo)
        assert ok is True
        assert result == "1-9"

    @pytest.mark.unit
    def test_longitud_maxima_permitida(self):
        rut_maximo = "99999999-9"
        ok, result = sanitize_rut(rut_maximo)
        assert ok is True
        assert result == "99999999-9"

    @pytest.mark.unit
    def test_longitud_un_caracter_menos_del_minimo(self):
        rut_corto = "1"
        ok, result = sanitize_rut(rut_corto)
        assert ok is False

    @pytest.mark.unit
    def test_longitud_un_caracter_mas_del_maximo(self):
        rut_largo = "999999999-9"
        ok, result = sanitize_rut(rut_largo)
        assert ok is False

    @pytest.mark.unit
    def test_rut_exactamente_9_caracteres_con_guion(self):
        rut = "1234567-9"
        ok, result = sanitize_rut(rut)
        assert ok is True
        assert len(result) == 9

    @pytest.mark.unit
    def test_rut_exactamente_10_caracteres_con_guion(self):
        rut = "12345678-9"
        ok, result = sanitize_rut(rut)
        assert ok is True
        assert len(result) == 10

    @pytest.mark.unit
    def test_rut_exactamente_11_caracteres_con_guion(self):
        rut = "123456789-9"
        ok, result = sanitize_rut(rut)
        assert ok is False

    @pytest.mark.unit
    @pytest.mark.parametrize("rut,esperado_ok", [
        ("1-9", True),
        ("12-9", True),
        ("123-9", True),
        ("1234-9", True),
        ("12345-9", True),
        ("123456-9", True),
        ("1234567-9", True),
        ("12345678-9", True),
        ("123456789-9", False),
        ("1234567890-9", False),
    ])
    def test_longitudes_variadas_parametrizadas(self, rut, esperado_ok):
        ok, result = sanitize_rut(rut)
        assert ok is esperado_ok
        if esperado_ok:
            assert isinstance(result, str)
            assert "-" in result
            assert "." not in result

    @pytest.mark.unit
    def test_cadena_vacia_longitud_cero(self):
        ok, result = sanitize_rut("")
        assert ok is False

    @pytest.mark.unit
    def test_longitud_exactamente_500_caracteres(self):
        payload = "1" * 500
        ok, result = sanitize_rut(payload)
        assert ok is False

    @pytest.mark.unit
    def test_longitud_exactamente_501_caracteres(self):
        payload = "1" * 501
        ok, result = sanitize_rut(payload)
        assert ok is False