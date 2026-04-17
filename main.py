import math
import random
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://127.0.0.1", "null"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
    allow_credentials=False,
)

class PromptRequest(BaseModel):
    prompt: str

class AnalysisResponse(BaseModel):
    tokens_estimados: int
    latencia_ms: int
    estado: str

def _calcular_tokens(prompt: str) -> int:
    return math.floor(len(prompt.split()) * 1.3)

def _evaluar_estado(tokens: int) -> str:
    return "Alerta" if tokens > 1000 else "Óptimo"

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_prompt(body: PromptRequest):
    tokens = _calcular_tokens(body.prompt)
    latencia_ms = random.randint(500, 2000)
    await asyncio.sleep(latencia_ms / 1000)
    estado = _evaluar_estado(tokens)
    return AnalysisResponse(tokens_estimados=tokens, latencia_ms=latencia_ms, estado=estado)