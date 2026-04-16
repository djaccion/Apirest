import asyncio
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn


class PromptRequest(BaseModel):
    prompt: str


app = FastAPI(title="Validador de Prompts y Tokens", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:3000", "null"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
    allow_credentials=False,
)


@app.post("/api/analyze")
async def analyze_prompt(request: PromptRequest):
    if not request.prompt.strip():
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "El prompt no puede estar vacío"},
        )

    words = request.prompt.split()
    word_count = len(words)
    estimated_tokens = int(word_count * 1.3)

    if estimated_tokens <= 1000:
        prompt_status = "Óptimo"
    else:
        prompt_status = "Alerta"

    delay_seconds = random.uniform(0.5, 2.0)
    await asyncio.sleep(delay_seconds)
    latency_ms = int(delay_seconds * 1000)

    return {
        "tokens": estimated_tokens,
        "latency_ms": latency_ms,
        "status": prompt_status,
        "word_count": word_count,
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Validador de Prompts y Tokens"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)