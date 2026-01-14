import json
from typing import AsyncGenerator, List
from functools import lru_cache
from pathlib import Path

from app.logs.logger import get_logger
from models import ChatRequest

from google.generativeai import GenerativeModel

logger = get_logger(__name__)

@lru_cache(maxsize=1)
def load_markdown_context() -> str:
    """Load backend/docs/about-me.md once per process."""
    context_path = Path(__file__).resolve().parents[2] / "docs" / "about-me.md"
    try:
        if context_path.exists():
            return context_path.read_text(encoding="utf-8")
    except Exception as e:
        logger.warning(f"Failed to load markdown context: {e}")
    return ""

class GeminiService:
    def __init__(self, llm_client: GenerativeModel, llm_model: str):
        self.llm_client = llm_client
        self.llm_model = llm_model
        self.max_context_messages = 10

    async def stream_chat(self, chat_request: ChatRequest) -> AsyncGenerator[str, None]:
        try:
            system_prompt = self._build_system_prompt()
            messages = self._build_messages(system_prompt, chat_request)

            # Gemini prefers `parts` format — but we can flatten into a prompt for now
            full_input = "\n".join(
                f"{msg['role'].capitalize()}: {msg['content']}" for msg in messages
            )

            response = self.llm_client.generate_content(
                [  # 👈 input must be a list of parts
                    {"text": full_input}
                ],
                stream=True,
            )

            for chunk in response:
                part = getattr(chunk, "text", "")
                if part:
                    yield f"0:{json.dumps(part)}\n"

        except Exception as e:
            logger.error(f"❌ Error in stream_chat: {str(e)}")
        
            yield f"0:{json.dumps("I'm sorry, something went wrong on the server.")}\n"
            return

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

    def _build_messages(self, system_prompt: str, chat_request: ChatRequest) -> List[dict]:
        messages = [{"role": "system", "content": system_prompt}]
        recent_messages = chat_request.messages[-self.max_context_messages:] if chat_request.messages else []
        messages.extend({"role": msg.role, "content": msg.content} for msg in recent_messages)
        messages.append({"role": "user", "content": chat_request.message})
        return messages
