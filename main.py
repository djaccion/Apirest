import asyncio
import random
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Validador de Prompts y Tokens",
    version="1.0.0",
    description="Microservicio validador de prompts y tokens"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:3000", "http://localhost:5500", "http://localhost:8080", "http://127.0.0.1:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class PromptRequest(BaseModel):
    prompt: str

class AnalysisResponse(BaseModel):
    tokens: int
    latency_ms: float
    status: str

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_prompt(request: PromptRequest) -> AnalysisResponse:
    start_time = time.time()

    simulated_latency = random.uniform(0.5, 2.0)
    await asyncio.sleep(simulated_latency)

    tokens = round(len(request.prompt.split()) * 1.3)

    if tokens <= 1000:
        status = "Óptimo"
    else:
        status = "Alerta"

    latency_ms = round((time.time() - start_time) * 1000, 2)

    return AnalysisResponse(tokens=tokens, latency_ms=latency_ms, status=status)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)