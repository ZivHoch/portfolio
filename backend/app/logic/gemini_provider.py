import os
from typing import AsyncGenerator, List

from google import genai

DEFAULT_MODEL = os.getenv("GEMINI_MODEL", os.getenv("LLM_MODEL", "gemini-2.0-flash"))
FALLBACK_MODELS = [
    m.strip()
    for m in os.getenv(
        "GEMINI_FALLBACK_MODELS",
        "gemini-2.0-flash,gemini-2.5-flash-lite,gemini-1.5-flash",
    ).split(",")
    if m.strip()
]


def _is_retryable(exc: Exception) -> bool:
    msg = str(exc).upper()
    return any(
        code in msg
        for code in ("503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED", "HIGH DEMAND")
    )


class GeminiProvider:
    def __init__(self, api_key: str | None = None, model: str | None = None):
        key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("LLM_ROUTER_API_KEY")
        if not key:
            raise ValueError("GEMINI_API_KEY is not set")
        self.client = genai.Client(api_key=key)
        primary = model or DEFAULT_MODEL
        models = [primary]
        for m in FALLBACK_MODELS:
            if m not in models:
                models.append(m)
        self.models = models

    def _build_contents(
        self, system_prompt: str, messages: List[dict], user_message: str
    ) -> list:
        contents = [{"role": "user", "parts": [{"text": system_prompt}]}]
        for m in messages:
            role = "model" if m.get("role") == "assistant" else "user"
            if m.get("role") == "system":
                continue
            contents.append({"role": role, "parts": [{"text": m["content"]}]})
        contents.append({"role": "user", "parts": [{"text": user_message}]})
        return contents

    async def stream_chat(
        self, system_prompt: str, messages: List[dict], user_message: str
    ) -> AsyncGenerator[str, None]:
        contents = self._build_contents(system_prompt, messages, user_message)
        last_error: Exception | None = None

        for model in self.models:
            try:
                stream = self.client.models.generate_content_stream(
                    model=model,
                    contents=contents,
                )
                yielded = False
                for chunk in stream:
                    text = getattr(chunk, "text", None) or ""
                    if text:
                        yielded = True
                        yield text
                if yielded:
                    return
            except Exception as e:
                last_error = e
                if _is_retryable(e):
                    continue
                raise

        if last_error:
            raise last_error
        raise RuntimeError("Gemini returned no content from any model")
