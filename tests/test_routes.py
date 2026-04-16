import pytest
from app import create_app


@pytest.fixture
def app():
    application = create_app()
    application.config["TESTING"] = True
    application.config["RATELIMIT_ENABLED"] = False
    return application


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def valid_payload():
    return {"rut": "12345678-9"}


class TestEndpointBasico:

    def test_endpoint_existe_y_acepta_post(self, client, valid_payload):
        response = client.post(
            "/api/validate-rut",
            json=valid_payload
        )
        assert response.status_code != 404
        assert response.status_code != 405

    def test_endpoint_rechaza_get(self, client):
        response = client.get("/api/validate-rut")
        assert response.status_code == 405

    def test_endpoint_rechaza_put(self, client):
        response = client.put(
            "/api/validate-rut",
            json={"rut": "12345678-9"}
        )
        assert response.status_code == 405

    def test_respuesta_es_json(self, client, valid_payload):
        response = client.post(
            "/api/validate-rut",
            json=valid_payload
        )
        assert "application/json" in response.content_type
        assert response.get_json() is not None


class TestEstructuraRespuesta:

    def test_respuesta_contiene_campo_valid(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": "11222333-9"}
        )
        data = response.get_json()
        assert "valid" in data

    def test_respuesta_contiene_campo_message(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": "11222333-9"}
        )
        data = response.get_json()
        assert "message" in data
        assert isinstance(data["message"], str)

    def test_respuesta_contiene_campo_rut_formateado(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": "11222333-9"}
        )
        data = response.get_json()
        if data.get("valid"):
            assert "rut_formateado" in data

    def test_campo_valid_es_booleano(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": "11222333-9"}
        )
        data = response.get_json()
        assert isinstance(data["valid"], bool)

    def test_respuesta_400_no_contiene_rut_formateado_o_es_nulo(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": "@@@@-!"}
        )
        assert response.status_code == 400
        data = response.get_json()
        if "rut_formateado" in data:
            assert data["rut_formateado"] is None


class TestRutsValidos:

    RUTS_VALIDOS = [
        "12345678-9",
        "5126663-3",
        "14569484-K",
        "14569484-k",
        "76354771-K",
        "60805000-0",
    ]

    @pytest.mark.parametrize("rut", RUTS_VALIDOS)
    def test_rut_valido_retorna_valid_true(self, client, rut):
        response = client.post(
            "/api/validate-rut",
            json={"rut": rut}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["valid"] is True

    @pytest.mark.parametrize("rut", RUTS_VALIDOS)
    def test_rut_valido_retorna_mensaje_positivo(self, client, rut):
        response = client.post(
            "/api/validate-rut",
            json={"rut": rut}
        )
        data = response.get_json()
        assert data["message"] is not None
        assert len(data["message"]) > 0

    @pytest.mark.parametrize("rut", RUTS_VALIDOS)
    def test_rut_formateado_tiene_guion(self, client, rut):
        response = client.post(
            "/api/validate-rut",
            json={"rut": rut}
        )
        data = response.get_json()
        assert "-" in data["rut_formateado"]


class TestRutsInvalidos:

    RUTS_INVALIDOS = [
        "12345678-0",
        "11111111-1",
        "22222222-2",
        "9876543-1",
        "14569484-5",
        "76354771-3",
    ]

    @pytest.mark.parametrize("rut", RUTS_INVALIDOS)
    def test_rut_invalido_retorna_valid_false(self, client, rut):
        response = client.post(
            "/api/validate-rut",
            json={"rut": rut}
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["valid"] is False

    @pytest.mark.parametrize("rut", RUTS_INVALIDOS)
    def test_rut_invalido_retorna_mensaje_descriptivo(self, client, rut):
        response = client.post(
            "/api/validate-rut",
            json={"rut": rut}
        )
        data = response.get_json()
        assert data["message"] is not None
        assert len(data["message"]) > 0


class TestFormatoInvalido:

    def test_payload_sin_campo_rut(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"numero": "12345678-9"}
        )
        assert response.status_code == 400

    def test_payload_no_es_json(self, client):
        response = client.post(
            "/api/validate-rut",
            data="12345678-9",
            content_type="text/plain"
        )
        assert response.status_code in (400, 415)

    @pytest.mark.parametrize("rut", [
        "12.345.678-9",
        "12345678@9",
        "12345678 9",
        '12345678"9',
        "12345678>9",
        "12345678<9",
    ])
    def test_rut_con_caracteres_especiales(self, client, rut):
        response = client.post(
            "/api/validate-rut",
            json={"rut": rut}
        )
        assert response.status_code == 400

    def test_rut_vacio(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": ""}
        )
        assert response.status_code == 400

    def test_rut_solo_letras(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": "abcdefgh"}
        )
        assert response.status_code == 400

    def test_rut_excesivamente_largo(self, client):
        response = client.post(
            "/api/validate-rut",
            json={"rut": "1" * 21}
        )
        assert response.status_code == 400