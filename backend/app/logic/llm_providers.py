import json
import os
from abc import ABC, abstractmethod
from typing import AsyncGenerator, List

import httpx

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "llama3.1:8b")
OPENAI_COMPAT_BASE_URL = os.getenv("OPENAI_COMPAT_BASE_URL", "http://localhost:11434/v1")
OPENAI_COMPAT_API_KEY = os.getenv("OPENAI_COMPAT_API_KEY", "ollama")
OPENAI_COMPAT_MODEL = os.getenv("OPENAI_COMPAT_MODEL", OLLAMA_CHAT_MODEL)


class LLMProvider(ABC):
    @abstractmethod
    async def stream_chat(
        self, system_prompt: str, messages: List[dict], user_message: str
    ) -> AsyncGenerator[str, None]:
        ...


class OllamaProvider(LLMProvider):
    async def stream_chat(
        self, system_prompt: str, messages: List[dict], user_message: str
    ) -> AsyncGenerator[str, None]:
        ollama_messages = [{"role": "system", "content": system_prompt}]
        for m in messages:
            role = m.get("role", "user")
            if role == "assistant":
                role = "assistant"
            elif role == "system":
                continue
            else:
                role = "user"
            ollama_messages.append({"role": role, "content": m["content"]})
        ollama_messages.append({"role": "user", "content": user_message})

        url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/chat"
        payload = {
            "model": OLLAMA_CHAT_MODEL,
            "messages": ollama_messages,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=300.0) as client:
            async with client.stream("POST", url, json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.strip():
                        continue
                    data = json.loads(line)
                    msg = data.get("message") or {}
                    content = msg.get("content", "")
                    if content:
                        yield content
                    if data.get("done"):
                        break


class OpenAICompatibleProvider(LLMProvider):
    async def stream_chat(
        self, system_prompt: str, messages: List[dict], user_message: str
    ) -> AsyncGenerator[str, None]:
        api_messages = [{"role": "system", "content": system_prompt}]
        for m in messages:
            if m.get("role") in ("user", "assistant"):
                api_messages.append({"role": m["role"], "content": m["content"]})
        api_messages.append({"role": "user", "content": user_message})

        url = f"{OPENAI_COMPAT_BASE_URL.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENAI_COMPAT_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": OPENAI_COMPAT_MODEL,
            "messages": api_messages,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=300.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    data = json.loads(data_str)
                    delta = data.get("choices", [{}])[0].get("delta", {})
                    content = delta.get("content", "")
                    if content:
                        yield content


def _gemini_provider():
    from app.logic.gemini_provider import GeminiProvider

    return GeminiProvider()


def _build_fallback_chain(primary: LLMProvider) -> LLMProvider:
    from app.logic.fallback_provider import FallbackLLMProvider

    fallbacks: list[LLMProvider] = [primary]
    use_ollama_fallback = os.getenv("LLM_FALLBACK_OLLAMA", "true").lower() == "true"
    has_gemini_key = bool(os.getenv("GEMINI_API_KEY") or os.getenv("LLM_ROUTER_API_KEY"))

    if use_ollama_fallback and not isinstance(primary, OllamaProvider):
        fallbacks.append(OllamaProvider())

    from app.logic.gemini_provider import GeminiProvider

    if has_gemini_key and not isinstance(primary, GeminiProvider):
        try:
            fallbacks.append(_gemini_provider())
        except ValueError:
            pass

    # Deduplicate by class name while preserving order
    seen: set[str] = set()
    unique: list[LLMProvider] = []
    for p in fallbacks:
        key = type(p).__name__
        if key not in seen:
            seen.add(key)
            unique.append(p)

    if len(unique) == 1:
        return unique[0]
    return FallbackLLMProvider(unique)


def get_llm_provider() -> LLMProvider:
    provider = os.getenv("LLM_PROVIDER", "").lower()

    if provider == "gemini":
        return _build_fallback_chain(_gemini_provider())

    if provider == "openai_compatible":
        return _build_fallback_chain(OpenAICompatibleProvider())

    if provider == "ollama":
        return _build_fallback_chain(OllamaProvider())

    # Auto: prefer local Ollama, fall back to Gemini when configured
    if os.getenv("GEMINI_API_KEY") or os.getenv("LLM_ROUTER_API_KEY"):
        return _build_fallback_chain(OllamaProvider())

    return OllamaProvider()
