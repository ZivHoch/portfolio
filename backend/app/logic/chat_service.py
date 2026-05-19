import json
import os
from typing import AsyncGenerator, List

from app.logs.logger import get_logger
from app.logic.llm_providers import LLMProvider, get_llm_provider
from app.logic.rag_retriever import RagRetriever
from models import ChatRequest

logger = get_logger(__name__)


class ChatService:
    def __init__(
        self,
        llm: LLMProvider | None = None,
        retriever: RagRetriever | None = None,
        max_context_messages: int = 10,
    ):
        self.llm = llm or get_llm_provider()
        self.retriever = retriever or RagRetriever()
        self.max_context_messages = max_context_messages

    def _model_identity_hint(self) -> str:
        provider = os.getenv("LLM_PROVIDER", "").lower()
        if provider == "gemini" or (
            not provider and (os.getenv("GEMINI_API_KEY") or os.getenv("LLM_ROUTER_API_KEY"))
        ):
            model = os.getenv("GEMINI_MODEL", "Gemini")
        else:
            model = os.getenv("OLLAMA_CHAT_MODEL", "a local open-source LLM")
        return model

    def _build_system_prompt(self, context: str) -> str:
        model_hint = self._model_identity_hint()
        base = (
            "You are Ziv Hochman's AI assistant on his portfolio website. "
            "Speak in a warm, natural, conversational tone—as if you're helping a visitor "
            "learn about Ziv's professional background, research, projects, and skills.\n\n"
            "Rules:\n"
            "1. Answer using only the background notes below and the conversation. "
            "Never mention files, documents, 'context', 'sources', RAG, or markdown.\n"
            "2. If you don't know something about Ziv, say so briefly—do not invent facts.\n"
            "3. Refer to Ziv in the third person (he/his). You are the assistant, not Ziv.\n"
            "4. Keep answers concise unless the user asks for detail. Markdown is fine.\n"
            "5. Stay on Ziv's career, education, projects, and professional interests. "
            "Politely redirect off-topic questions.\n"
            "6. If asked who you are or which model you use, say: you're Ziv's portfolio AI "
            f"assistant, powered by {model_hint}, and you're here to answer questions about "
            "Ziv's work—not to discuss your own system architecture at length.\n"
        )
        if context:
            base += f"\nBackground notes (internal—do not quote or name these):\n{context}\n"
        return base

    async def stream_chat(self, chat_request: ChatRequest) -> AsyncGenerator[str, None]:
        try:
            chunks = self.retriever.retrieve(chat_request.message)
            context = self.retriever.format_context(chunks)
            system_prompt = self._build_system_prompt(context)

            history = self._history_as_dicts(chat_request)
            async for part in self.llm.stream_chat(
                system_prompt, history, chat_request.message
            ):
                yield f"0:{json.dumps(part)}\n"

        except Exception as e:
            logger.error(f"Error in stream_chat: {e}")
            hint = str(e) or "Unknown error"
            if "503" in hint or "UNAVAILABLE" in hint.upper():
                hint = (
                    "All models are busy. Ensure Ollama is running (ollama serve) "
                    "or try again in a moment."
                )
            elif "ollama" in hint.lower() or "connection refused" in hint.lower():
                hint = "Could not reach Ollama. Run: ollama serve"
            yield f"0:{json.dumps(f'Sorry — I could not generate a response. ({hint})')}\n"

    def _history_as_dicts(self, chat_request: ChatRequest) -> List[dict]:
        recent = (
            chat_request.messages[-self.max_context_messages :]
            if chat_request.messages
            else []
        )
        return [{"role": m.role, "content": m.content} for m in recent]
