from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.factory import chat_service
from app.logic.chat_service import ChatService
from app.logs.logger import get_logger
from app.models.data_structures import ChatRequest

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
async def chat(chat_request: ChatRequest):
    """Chat endpoint that streams responses"""
    try:
        return StreamingResponse(
            chat_handler.stream_chat(chat_request),
            media_type="text/event-stream"
        )
    except Exception:
        logger.exception("Unexpected error during chat")
        raise HTTPException(
            status_code=500,
            detail="An internal server error occurred while processing your message."
        )
