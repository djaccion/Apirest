import random
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import uvicorn

app = FastAPI(title="Prompt Analyzer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5500",
        "http://localhost:8080",
        "http://127.0.0.1:5500",
        "null"
    ],
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["Content-Type"]
)


class PromptRequest(BaseModel):
    prompt: str

    @field_validator("prompt", mode="before")
    @classmethod
    def validate_prompt(cls, value):
        if len(value.strip()) == 0:
            raise ValueError("El prompt no puede estar vacío")
        if len(value) > 10000:
            raise ValueError("El prompt excede el límite de caracteres permitido")
        return value


class AnalysisResponse(BaseModel):
    word_count: int
    token_estimate: int
    status: str
    latency_ms: float


def calculate_tokens(text: str) -> int:
    words = text.split()
    word_count = len(words)
    token_estimate = word_count * 1.3
    return int(token_estimate)


def determine_status(token_estimate: int) -> str:
    if token_estimate <= 1000:
        return "Óptimo"
    return "Alerta"


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_prompt(request: PromptRequest):
    start_time = asyncio.get_event_loop().time()
    await asyncio.sleep(random.uniform(0.5, 2.0))
    token_estimate = calculate_tokens(request.prompt)
    word_count = len(request.prompt.split())
    status = determine_status(token_estimate)
    latency_ms = round((asyncio.get_event_loop().time() - start_time) * 1000, 2)
    return AnalysisResponse(
        word_count=word_count,
        token_estimate=token_estimate,
        status=status,
        latency_ms=latency_ms
    )


@app.post("/api/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)