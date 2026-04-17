import asyncio
import random
import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

app = FastAPI(
    title="Validador de Prompts y Tokens",
    version="1.0.0",
    description="Microservicio que analiza prompts calculando tokens estimados y determinando su estado de optimización"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5500",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5500",
        "http://127.0.0.1:8080",
        "null"
    ],
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"]
)


class PromptRequest(BaseModel):
    prompt: str = Field(
        min_length=1,
        max_length=10000,
        description="Texto del prompt a analizar para calcular tokens y determinar su estado de optimización"
    )


class AnalysisResponse(BaseModel):
    tokens: int
    latency_ms: float
    status: str


def calculate_tokens(prompt: str) -> int:
    words = prompt.split()
    return round(len(words) * 1.3)


def determine_status(tokens: int) -> str:
    if tokens <= 1000:
        return "Óptimo"
    return "Alerta"


@app.post(
    "/api/analyze",
    response_model=AnalysisResponse,
    summary="Analiza un prompt calculando tokens estimados y estado de optimización",
    status_code=200
)
async def analyze_prompt(request: PromptRequest):
    start_time = time.time()

    await asyncio.sleep(random.uniform(0.5, 2.0))

    tokens = calculate_tokens(request.prompt)

    status = determine_status(tokens)

    latency_ms = round((time.time() - start_time) * 1000, 2)

    return AnalysisResponse(
        tokens=tokens,
        latency_ms=latency_ms,
        status=status
    )


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "Validador de Prompts y Tokens"
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)