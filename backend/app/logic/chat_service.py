from pathlib import Path
import json
from typing import AsyncGenerator, List
from functools import lru_cache

from app.logs.logger import get_logger
from models import ChatRequest

from google import genai

logger = get_logger(__name__)


@lru_cache(maxsize=1)
def load_markdown_context() -> str:
    """Load backend/docs/about-me.md once per process to avoid disk I/O on every request."""
    context_path = Path(__file__).resolve().parents[2] / "docs" / "about-me.md"
    try:
        if context_path.exists():
            return context_path.read_text(encoding="utf-8")
    except Exception as e:
        logger.warning(f"Failed to load markdown context: {e}")
    return ""


class ChatService:
    def __init__(self, llm_client: genai.Client, llm_model: str):
        self.llm_client = llm_client
        self.llm_model = llm_model
        self.max_context_messages = 10

    def _build_system_prompt(self) -> str:
        base = (
            "You are a professional AI assistant, designed to provide engaging, "
            "personalized interactions based on my experiences and writings. Your responses should:\n"
            "1. Be accurate and rely solely on provided context or prior messages.\n"
            "2. Be concise, direct, and use markdown formatting when appropriate.\n"
            "3. Show personality while remaining professional.\n"
            "4. Clearly indicate when you are uncertain rather than guessing.\n"
            "5. Decline to share sensitive or harmful information.\n"
        )

        context = load_markdown_context()
        if context:
            base += "\nContext (about Ziv):\n" + context + "\n"

        return base

    async def stream_chat(self, chat_request: ChatRequest) -> AsyncGenerator[str, None]:
        try:
            system_prompt = self._build_system_prompt()
            messages = self._build_messages(system_prompt, chat_request)

            # Gemini input format: list of message parts
            full_input = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in messages])

            # New google-genai SDK: stream with client.models.generate_content_stream(...)
            response_stream = self.llm_client.models.generate_content_stream(
                model=self.llm_model,
                contents=full_input,
            )

            for chunk in response_stream:
                part = getattr(chunk, "text", None)
                if part:
                    yield f"0:{json.dumps(part)}\n"

        except Exception as e:
            logger.error(f"Error in stream_chat: {str(e)}")
            # In streaming responses, raising an exception after yielding causes
            # "response already started". Emit a final chunk and end the stream.
            yield f"0:{json.dumps('Error: An error occurred while processing your request')}\n"
            return

    def _build_messages(self, system_prompt: str, chat_request: ChatRequest) -> List[dict]:
        messages = [{"role": "system", "content": system_prompt}]
        recent_messages = chat_request.messages[-self.max_context_messages:] if chat_request.messages else []
        messages.extend({"role": msg.role, "content": msg.content} for msg in recent_messages)
        messages.append({"role": "user", "content": chat_request.message})
        return messages
