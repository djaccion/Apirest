import asyncio
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import uvicorn

app = FastAPI(title="Validador de Prompts API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
    allow_credentials=False,
)


class PromptRequest(BaseModel):
    prompt: str

    @field_validator("prompt")
    @classmethod
    def prompt_no_vacio(cls, v):
        if not v or not v.strip():
            raise ValueError("El prompt no puede estar vacío")
        return v


def _analizar_prompt(prompt: str) -> dict:
    palabras = len(prompt.split())
    tokens_estimados = round(palabras * 1.3)
    caracteres = len(prompt)

    if tokens_estimados <= 100:
        estado = "Óptimo"
        color_estado = "green"
    elif 101 <= tokens_estimados <= 300:
        estado = "Alerta"
        color_estado = "yellow"
    else:
        estado = "Crítico"
        color_estado = "red"

    return {
        "tokens_estimados": tokens_estimados,
        "caracteres": caracteres,
        "estado": estado,
        "color_estado": color_estado,
    }


@app.post("/api/analyze", response_model=dict, summary="Analiza un prompt y estima sus tokens")
async def analyze_prompt(body: PromptRequest) -> dict:
    latencia = random.uniform(0.5, 2.0)
    await asyncio.sleep(latencia)

    try:
        resultado = _analizar_prompt(body.prompt)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Error interno del servidor")

    return {
        "tokens_estimados": resultado["tokens_estimados"],
        "caracteres": resultado["caracteres"],
        "estado": resultado["estado"],
        "color_estado": resultado["color_estado"],
        "latencia_ms": round(latencia, 2),
        "palabras": len(body.prompt.split()),
    }


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok", "service": "validador-prompts"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)