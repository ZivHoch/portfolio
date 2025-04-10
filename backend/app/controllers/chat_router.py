from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.factory import chat_service
from app.logic.chat_service import ChatService
from app.logs.logger import get_logger
from app.models.data_structures import ChatRequest
from app.logic.gemini_service import stream_from_gemini
logger = get_logger(__name__)

# ✅ Create router instance
router = APIRouter()

# ✅ Inject ChatService instance from factory
chat_handler: ChatService = chat_service()


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
    return StreamingResponse(
        stream_from_gemini(chat_request.message),
        media_type="text/event-stream"
    )