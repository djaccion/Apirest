import random
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://127.0.0.1", "null"],
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

class PromptRequest(BaseModel):
    prompt: str

@app.post("/api/analyze")
async def analyze(request: PromptRequest):
    estimated_tokens = int(len(request.prompt.split()) * 1.3)
    simulated_latency_ms = random.randint(500, 2000)
    await asyncio.sleep(simulated_latency_ms / 1000)
    status = "Alerta" if estimated_tokens > 1000 else "Óptimo"
    return {
        "estimated_tokens": estimated_tokens,
        "simulated_latency_ms": simulated_latency_ms,
        "status": status,
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)