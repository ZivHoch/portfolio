import os
from typing import List

import httpx

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "768"))


class EmbeddingClient:
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_query(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/embeddings"
        payload = {"model": OLLAMA_EMBED_MODEL, "prompt": text}

        with httpx.Client(timeout=120.0) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        embedding = data.get("embedding")
        if not embedding:
            raise RuntimeError("Ollama returned no embedding")

        return embedding
