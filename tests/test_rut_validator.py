import pytest
from app import create_app
from rut_validator import validate_rut, calculate_dv


@pytest.fixture(scope="function")
def client():
    app = create_app()
    app.config["TESTING"] = True
    app.config["RATELIMIT_ENABLED"] = False
    with app.test_client() as client:
        yield client


@pytest.fixture
def valid_ruts():
    return [
        ("12345678", "9"),
        ("11111111", "1"),
        ("22222222", "2"),
        ("7654321", "K"),
        ("5765432", "K"),
        ("9999999", "0"),
        ("76354771", "4"),
        ("18585543", "0"),
        ("17248000", "7"),
        ("14569484", "5"),
    ]


@pytest.fixture
def invalid_ruts():
    return [
        "12345678-0",
        "11111111-9",
        "22222222-5",
        "76354771-9",
        "18585543-3",
    ]


class TestRutAlgorithm:

    def test_dv_numerico_correcto(self):
        casos = [
            ("12345678", "9"),
            ("76354771", "4"),
            ("14569484", "5"),
            ("17248000", "7"),
            ("20000000", "3"),
        ]
        for rut_body, dv_esperado in casos:
            resultado = calculate_dv(rut_body)
            assert resultado == dv_esperado, (
                f"Para RUT {rut_body} se esperaba DV {dv_esperado} pero se obtuvo {resultado}"
            )

    def test_dv_k_correcto(self):
        casos_k = [
            ("7654321", "K"),
            ("5765432", "K"),
        ]
        for rut_body, dv_esperado in casos_k:
            resultado = calculate_dv(rut_body)
            assert resultado.upper() == "K", (
                f"Para RUT {rut_body} se esperaba DV K pero se obtuvo {resultado}"
            )
            assert resultado.upper() == dv_esperado.upper()

    def test_dv_cero_correcto(self):
        casos_cero = [
            ("9999999", "0"),
            ("18585543", "0"),
        ]
        for rut_body, dv_esperado in casos_cero:
            resultado = calculate_dv(rut_body)
            assert resultado == "0", (
                f"Para RUT {rut_body} se esperaba DV 0 pero se obtuvo {resultado}"
            )

    def test_rut_minimo_valido(self):
        rut_body = "1"
        resultado = calculate_dv(rut_body)
        assert resultado is not None
        assert isinstance(resultado, str)
        assert len(resultado) == 1

    def test_rut_maximo_digitos(self):
        casos_8_digitos = [
            ("12345678", "9"),
            ("76354771", "4"),
            ("18585543", "0"),
        ]
        for rut_body, dv_esperado in casos_8_digitos:
            assert len(rut_body) == 8
            resultado = calculate_dv(rut_body)
            assert resultado == dv_esperado, (
                f"Para RUT de 8 dígitos {rut_body} se esperaba DV {dv_esperado} pero se obtuvo {resultado}"
            )

    def test_dv_incorrecto_retorna_falso(self):
        casos_incorrectos = [
            ("12345678", "0"),
            ("76354771", "9"),
            ("18585543", "3"),
        ]
        for rut_body, dv_incorrecto in casos_incorrectos:
            dv_calculado = calculate_dv(rut_body)
            assert dv_calculado != dv_incorrecto, (
                f"Para RUT {rut_body} el DV incorrecto {dv_incorrecto} no debería coincidir con el calculado"
            )
            resultado = validate_rut(f"{rut_body}-{dv_incorrecto}")
            assert resultado is False or resultado.get("valid") is False


class TestRutFormatValidation:

    def test_formato_con_puntos_y_guion(self):
        resultado = validate_rut("12.345.678-9")
        if isinstance(resultado, dict):
            assert resultado.get("valid") is True
        else:
            assert resultado is True

    def test_formato_solo_guion(self):
        resultado = validate_rut("12345678-9")
        if isinstance(resultado, dict):
            assert resultado.get("valid") is True
        else:
            assert resultado is True

    def test_formato_sin_separadores(self):
        resultado = validate_rut("123456789")
        if isinstance(resultado, dict):
            assert resultado.get("valid") is False
            assert "message" in resultado
        else:
            assert resultado is False

    def test_entrada_vacia(self):
        resultado = validate_rut("")
        if isinstance(resultado, dict):
            assert resultado.get("valid") is False
        else:
            assert resultado is False

    def test_entrada_solo_letras(self):
        resultado = validate_rut("ABCDEFG-H")
        if isinstance(resultado, dict):
            assert resultado.get("valid") is False
        else:
            assert resultado is False

    def test_entrada_con_caracteres_especiales(self):
        payloads_maliciosos = [
            "<script>alert(1)</script>",
            "'; DROP TABLE ruts; --",
            "\" OR 1=1 --",
            "<img src=x onerror=alert(1)>",
        ]
        for payload in payloads_maliciosos:
            try:
                resultado = validate_rut(payload)
                if isinstance(resultado, dict):
                    assert resultado.get("valid") is False, (
                        f"Payload malicioso '{payload}' no debería ser válido"
                    )
                else:
                    assert resultado is False, (
                        f"Payload malicioso '{payload}' no debería ser válido"
                    )
            except Exception as e:
                pytest.fail(
                    f"validate_rut lanzó una excepción no controlada para payload '{payload}': {e}"
                )

    def test_entrada_con_espacios(self):
        casos_con_espacios = [
            " 12345678-9",
            "12345678-9 ",
            " 12345678-9 ",
        ]
        for rut_con_espacios in casos_con_espacios:
            resultado = validate_rut(rut_con_espacios)
            assert resultado is not None, (
                f"validate_rut no debería retornar None para '{rut_con_espacios}'"
            )

    def test_rut_con_letras_en_cuerpo(self):
        resultado = validate_rut("1A345678-9")
        if isinstance(resultado, dict):
            assert resultado.get("valid") is False
        else:
            assert resultado is False


class TestValidateRutEndpoint:

    def test_post_rut_valido_retorna_200(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": "12.345.678-9"},
            content_type="application/json",
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data is not None
        assert "valid" in data
        assert data["valid"] is True
        assert "message" in data
        assert isinstance(data["message"], str)
        assert len(data["message"]) > 0
        assert "rut_formateado" in data
        rut_formateado = data["rut_formateado"]
        assert isinstance(rut_formateado, str)
        assert "-" in rut_formateado
        assert "." in rut_formateado

    def test_post_rut_invalido_retorna_200_valid_false(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": "12345678-0"},
            content_type="application/json",
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data is not None
        assert "valid" in data
        assert data["valid"] is False
        assert "message" in data
        assert isinstance(data["message"], str)
        assert len(data["message"]) > 0

    def test_post_formato_invalido_retorna_400(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": "ABCDEFG-H"},
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data is not None
        assert "message" in data

    def test_post_sin_campo_rut_retorna_400(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"otro_campo": "valor"},
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data is not None
        assert "message" in data

    def test_post_body_vacio_retorna_400(self, client):
        response = client.post(
            "/api/validate-rut",
            json={},
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data is not None

    def test_post_rut_vacio_retorna_400(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": ""},
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data is not None
        assert "message" in data

    def test_post_payload_xss_retorna_400(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": "<script>alert(1)</script>"},
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data is not None
        if "rut_formateado" in data:
            assert "<script>" not in data["rut_formateado"]

    def test_post_payload_sql_injection_retorna_400(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": "'; DROP TABLE ruts; --"},
            content_type="application/json",
        )
        assert response.status_code == 400
        data = response.get_json()
        assert data is not None

    def test_get_method_not_allowed(self, client):
        response = client.get("/api/validate-rut")
        assert response.status_code == 405

    def test_post_rut_con_dv_k_valido(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": "7654321-K"},
            content_type="application/json",
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data is not None
        assert "valid" in data
        assert data["valid"] is True

    def test_post_rut_con_dv_k_minuscula_valido(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": "7654321-k"},
            content_type="application/json",
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data is not None
        assert "valid" in data
        assert data["valid"] is True

    def test_response_content_type_json(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": "12345678-9"},
            content_type="application/json",
        )
        assert "application/json" in response.content_type

    def test_post_multiples_ruts_validos(self, client):
        ruts_validos = [
            "12.345.678-9",
            "76.354.771-4",
            "14.569.484-5",
        ]
        for rut in ruts_validos:
            response = client.post(
                "/api/validate-rut",
                json={"rut": rut},
                content_type="application/json",
            )
            assert response.status_code == 200
            data = response.get_json()
            assert data["valid"] is True, f"RUT {rut} debería ser válido"

    def test_post_multiples_ruts_invalidos(self, client):
        ruts_invalidos = [
            "12345678-0",
            "76354771-9",
            "14569484-3",
        ]
        for rut in ruts_invalidos:
            response = client.post(
                "/api/validate-rut",
                json={"rut": rut},
                content_type="application/json",
            )
            assert response.status_code == 200
            data = response.get_json()
            assert data["valid"] is False, f"RUT {rut} debería ser inválido"

    def test_security_headers_presentes(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": "12345678-9"},
            content_type="application/json",
        )
        assert response.status_code == 200
        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        assert response.headers.get("X-Frame-Options") is not None

    def test_post_content_type_no_json_retorna_400(self, client):
        response = client.post(
            "/api/validate-rut",
            data="rut=12345678-9",
            content_type="application/x-www-form-urlencoded",
        )
        assert response.status_code in [400, 415]