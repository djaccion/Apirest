import asyncio
import random
from math import floor
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

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
    estimated_tokens: int
    simulated_latency_ms: int
    status: str


def _calculate_tokens(text: str) -> int:
    text = text.strip()
    if not text:
        return 0
    word_count = len(text.split())
    estimated = floor(word_count * 1.3)
    return max(1, estimated)


def _evaluate_status(token_count: int) -> str:
    return "Alerta" if token_count > 1000 else "Óptimo"


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_prompt(request: PromptRequest):
    estimated_tokens = _calculate_tokens(request.prompt)
    latency_ms = random.randint(500, 2000)
    await asyncio.sleep(latency_ms / 1000)
    status = _evaluate_status(estimated_tokens)
    return AnalysisResponse(
        estimated_tokens=estimated_tokens,
        simulated_latency_ms=latency_ms,
        status=status,
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)