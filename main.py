import asyncio
import random

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

TOKENS_POR_PALABRA: float = 1.3
COSTO_POR_TOKEN: float = 0.000002
LATENCIA_RANGO: tuple[float, float] = (0.5, 2.0)

UMBRAL_TOKENS_ADVERTENCIA: int = 4000


class PromptRequest(BaseModel):
    prompt: str


class AnalysisResult(BaseModel):
    tokens_estimados: int
    costo_estimado_usd: float
    latencia_simulada_ms: int
    palabras_contadas: int
    advertencia: str | None


def _contar_palabras(texto: str) -> int:
    texto = texto.strip()
    if not texto:
        return 0
    return len(texto.split())


def _estimar_tokens(palabras: int) -> int:
    return int(palabras * TOKENS_POR_PALABRA)


def _calcular_costo(tokens: int) -> float:
    return round(tokens * COSTO_POR_TOKEN, 6)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500", "null"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_prompt(request: PromptRequest) -> AnalysisResult:
    palabras = _contar_palabras(request.prompt)
    tokens = _estimar_tokens(palabras)
    costo = _calcular_costo(tokens)

    latencia_segundos = random.uniform(LATENCIA_RANGO[0], LATENCIA_RANGO[1])
    await asyncio.sleep(latencia_segundos)
    latencia_ms = int(latencia_segundos * 1000)

    advertencia: str | None = None
    if tokens > UMBRAL_TOKENS_ADVERTENCIA:
        advertencia = f"El prompt supera los {UMBRAL_TOKENS_ADVERTENCIA} tokens estimados ({tokens}). Considera reducir su longitud."

    return AnalysisResult(
        tokens_estimados=tokens,
        costo_estimado_usd=costo,
        latencia_simulada_ms=latencia_ms,
        palabras_contadas=palabras,
        advertencia=advertencia,
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)