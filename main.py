import asyncio
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Prompt Analyzer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://127.0.0.1", "null"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
    allow_credentials=False,
)


class PromptRequest(BaseModel):
    prompt: str


class AnalysisResponse(BaseModel):
    tokens_estimados: int
    latencia_ms: int
    estado: str


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_prompt(request: PromptRequest):
    tokens_estimados = round(len(request.prompt.split()) * 1.3)

    latencia_ms = random.randint(500, 2000)

    await asyncio.sleep(latencia_ms / 1000)

    if tokens_estimados <= 1000:
        estado = "Óptimo"
    else:
        estado = "Alerta"

    return AnalysisResponse(
        tokens_estimados=tokens_estimados,
        latencia_ms=latencia_ms,
        estado=estado,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)