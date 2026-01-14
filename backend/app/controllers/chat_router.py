from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.factory import chat_service
from models import ChatRequest

router = APIRouter()


@router.get("/")
async def home():
    """Home endpoint"""
    return {"message": "Backend is up and running!"}


@router.get("/healthz")
async def health_check():
    """Health check endpoint for Render or monitoring"""
    return {"status": "ok"}


@router.post("/chat")
async def chat_endpoint(chat_request: ChatRequest):
    service = chat_service()
    return StreamingResponse(
        service.stream_chat(chat_request),
        media_type="text/event-stream",
    )