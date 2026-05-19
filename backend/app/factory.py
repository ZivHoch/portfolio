import os
from functools import lru_cache

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.logic.chat_service import ChatService


def create_app() -> FastAPI:
    """Creates and configures the FastAPI application."""
    load_dotenv()
    app = FastAPI(title="Portfolio RAG API")

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

    from app.controllers.chat_router import router as chat_router

    app.include_router(chat_router)

    return app


@lru_cache(maxsize=1)
def chat_service() -> ChatService:
    return ChatService()
