import logging
from typing import AsyncGenerator, List

from app.logic.llm_providers import LLMProvider

logger = logging.getLogger(__name__)


class FallbackLLMProvider(LLMProvider):
    """Try providers in order; use the first one that returns a stream."""

    def __init__(self, providers: List[LLMProvider]):
        if not providers:
            raise ValueError("FallbackLLMProvider requires at least one provider")
        self.providers = providers

    async def stream_chat(
        self, system_prompt: str, messages: List[dict], user_message: str
    ) -> AsyncGenerator[str, None]:
        last_error: Exception | None = None

        for provider in self.providers:
            name = type(provider).__name__
            try:
                yielded = False
                async for chunk in provider.stream_chat(
                    system_prompt, messages, user_message
                ):
                    yielded = True
                    yield chunk
                if yielded:
                    if last_error:
                        logger.info("Recovered using %s after earlier failure", name)
                    return
            except Exception as e:
                last_error = e
                logger.warning("%s failed: %s", name, e)
                continue

        if last_error:
            raise last_error
        raise RuntimeError("All LLM providers failed without yielding content")
