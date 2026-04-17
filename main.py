import asyncio
import random
import time
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import uvicorn

app = FastAPI(
    title="Validador de Prompts",
    version="1.0.0",
    description="Microservicio para validar y analizar prompts estimando tokens y latencia."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:8000",
        "http://localhost:3000",
        "http://127.0.0.1",
        "http://127.0.0.1:8000",
        ""
    ],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


class PromptRequest(BaseModel):
    prompt: str

    @validator("prompt")
    def prompt_no_vacio(cls, v):
        v = v.strip()
        if v == "":
            raise ValueError("El prompt no puede estar vacío")
        return v


class AnalysisResponse(BaseModel):
    tokens_estimados: int
    latency_ms: float
    estado: str
    palabra_count: int
    status: str = "ok"


def _calcular_tokens(prompt: str) -> dict:
    palabras = prompt.split()
    palabra_count = len(palabras)
    tokens_estimados = int(round(palabra_count * 1.3))
    if tokens_estimados <= 1000:
        estado = "Óptimo"
    else:
        estado = "Alerta"
    return {
        "tokens_estimados": tokens_estimados,
        "palabra_count": palabra_count,
        "estado": estado
    }


@app.post("/api/analyze")
async def analyze_prompt(request: PromptRequest):
    inicio = time.perf_counter()
    resultado = _calcular_tokens(request.prompt)
    await asyncio.sleep(random.uniform(0.5, 2.0))
    latency_ms = round((time.perf_counter() - inicio) * 1000, 2)
    return {
        "tokens_estimados": resultado["tokens_estimados"],
        "latency_ms": latency_ms,
        "estado": resultado["estado"],
        "palabra_count": resultado["palabra_count"],
        "status": "ok"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": str(exc)
        }
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)