from fastapi import FastAPI

from .models import ChatRequest, ChatResponse

app = FastAPI(title="Evolving AI Chat Runtime", version="0.1.0")


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    return ChatResponse.from_message(payload.message)
