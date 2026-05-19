import json
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

    def _build_system_prompt(self, context: str) -> str:
        base = (
            "You are a professional AI assistant designed to answer questions about Ziv Hochman.\n\n"
            "Rules:\n"
            "1. Use ONLY the provided context and chat history.\n"
            "2. If something is not in the context, say you don't know.\n"
            "3. Do NOT invent facts.\n"
            "4. Be concise, clear, and friendly.\n"
            "5. Use Markdown formatting when helpful.\n"
            "6. Do not store or learn new personal data about Ziv.\n"
            "7. If the user asks unrelated questions, politely redirect.\n"
        )
        if context:
            base += f"\nContext:\n{context}\n"
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
            yield f"0:{json.dumps('Sorry — I could not generate a response. Is Ollama running?')}\n"

    def _history_as_dicts(self, chat_request: ChatRequest) -> List[dict]:
        recent = (
            chat_request.messages[-self.max_context_messages :]
            if chat_request.messages
            else []
        )
        return [{"role": m.role, "content": m.content} for m in recent]
