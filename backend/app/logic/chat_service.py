import os
import json
from typing import AsyncGenerator, List
from fastapi import HTTPException

from app.logs.logger import get_logger
from app.models.data_structures import ChatRequest

from google.generativeai.types import GenerateContentResponse
from google.generativeai import GenerativeModel

logger = get_logger(__name__)


class ChatService:
    def __init__(self, llm_client: GenerativeModel, llm_model: str):
        self.llm_client = llm_client
        self.llm_model = llm_model
        self.max_context_messages = 10

    async def stream_chat(self, chat_request: ChatRequest) -> AsyncGenerator[str, None]:
        try:
            system_prompt = self._build_system_prompt()
            messages = self._build_messages(system_prompt, chat_request)

            # Gemini input format: list of message parts
            full_input = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in messages])

            response: GenerateContentResponse = self.llm_client.generate_content(
                full_input,
                stream=True,
            )

            for chunk in response:
                part = chunk.text
                if part:
                    yield f"0:{json.dumps(part)}\n"

        except Exception as e:
            logger.error(f"Error in stream_chat: {str(e)}")
            raise HTTPException(status_code=500, detail="An error occurred while processing your request")

    def _build_system_prompt(self) -> str:
        return (
            "You are a professional AI assistant, designed to provide engaging, "
            "personalized interactions based on my experiences and writings. Your responses should:\n"
            "1. Be accurate and rely solely on provided context or prior messages.\n"
            "2. Be concise, direct, and use markdown formatting when appropriate.\n"
            "3. Show personality while remaining professional.\n"
            "4. Clearly indicate when you are uncertain rather than guessing.\n"
            "5. Decline to share sensitive or harmful information.\n"
        )

    def _build_messages(self, system_prompt: str, chat_request: ChatRequest) -> List[dict]:
        messages = [{"role": "system", "content": system_prompt}]
        recent_messages = chat_request.messages[-self.max_context_messages:] if chat_request.messages else []
        messages.extend({"role": msg.role, "content": msg.content} for msg in recent_messages)
        messages.append({"role": "user", "content": chat_request.message})
        return messages
