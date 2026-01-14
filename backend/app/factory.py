import os
from functools import lru_cache

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.logic.chat_service import ChatService


def create_app() -> FastAPI:
    """Creates and configures the FastAPI application."""
    load_dotenv()
    app = FastAPI()

    # CORS configuration
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            frontend_url,
            "http://localhost:5173",
            "http://localhost:3000",
            "https://zivdev.netlify.app",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Routers (local import to avoid circular imports during module initialization)
    from app.controllers.chat_router import router as chat_router
    app.include_router(chat_router)

    return app


@lru_cache(maxsize=1)
def genai_client():
    """Create and cache the Google GenAI client once per process."""
    from google import genai

    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("LLM_ROUTER_API_KEY")
    if api_key:
        # Explicit key wins (useful locally and on hosts that don't auto-inject env vars)
        return genai.Client(api_key=api_key)

    # If GEMINI_API_KEY is set in the environment, the SDK will pick it up automatically.
    return genai.Client()


@lru_cache(maxsize=1)
def chat_service() -> ChatService:
    """Create and cache the chat service once per process."""
    return ChatService(
        llm_client=genai_client(),
        llm_model=os.getenv("LLM_MODEL", "gemini-2.5-flash-lite"),
    )
