import os
from functools import lru_cache
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.logic.chat_service import ChatService
# from app.logic.document_indexer import DocumentIndexer
from google.generativeai import GenerativeModel

# --- FastAPI App Factory ---
def create_app() -> FastAPI:
    """Creates and configures the FastAPI application with middleware"""
    app = FastAPI()

    # CORS configuration
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://zivdev.netlify.app"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app

# --- Google Gemini Client ---
@lru_cache()
def gemini_model() -> GenerativeModel:
    """Returns a cached instance of the Gemini generative model"""
    from google.generativeai import configure
    configure(api_key=os.getenv("LLM_ROUTER_API_KEY"))

    return GenerativeModel(model_name="gemini-pro")

# --- Embeddings Stub (Optional if you're not using embedding search yet) ---
@lru_cache()
def embeddings():
    """Stub for embeddings (adjust as needed if you're using vector search)"""
    return None  # Replace with real embedding setup if needed

# --- Chat Service Stub ---
@lru_cache()
def chat_service() -> ChatService:
    """Creates and caches the chat service instance"""
    return ChatService(
        llm_client=gemini_model(),
        llm_model="gemini-pro"  # or use os.getenv("LLM_MODEL")
    )

# --- Optional: Document Indexer Stub ---
# @lru_cache()
# def document_indexer() -> DocumentIndexer:
#     """Creates and caches document indexer instance"""
#     return DocumentIndexer(
#         embeddings=embeddings()
#     )
