import os
from pathlib import Path
from typing import List

from app.db.database import get_connection, is_database_configured
from app.logic.embeddings import EmbeddingClient

KNOWLEDGE_DIR = Path(
    os.getenv(
        "KNOWLEDGE_DIR",
        str(Path(__file__).resolve().parents[2] / "knowledge"),
    )
)
TOP_K = int(os.getenv("RAG_TOP_K", "5"))


class RagRetriever:
    def __init__(self, embeddings: EmbeddingClient | None = None):
        self.embeddings = embeddings or EmbeddingClient()

    def retrieve(self, query: str, top_k: int = TOP_K) -> List[dict]:
        if is_database_configured():
            try:
                return self._retrieve_from_db(query, top_k)
            except Exception:
                pass
        return self._retrieve_fallback(query)

    def _retrieve_from_db(self, query: str, top_k: int) -> List[dict]:
        vector = self.embeddings.embed_query(query)
        vector_literal = "[" + ",".join(str(x) for x in vector) + "]"

        sql = """
            SELECT source_file, chunk_index, content,
                   1 - (embedding <=> %s::vector) AS score
            FROM knowledge_chunks
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> %s::vector
            LIMIT %s
        """

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (vector_literal, vector_literal, top_k))
                rows = cur.fetchall()

        return [
            {
                "source_file": r[0],
                "chunk_index": r[1],
                "content": r[2],
                "score": float(r[3]) if r[3] is not None else 0.0,
            }
            for r in rows
        ]

    def _retrieve_fallback(self, query: str) -> List[dict]:
        """Load all markdown when DB is unavailable (local dev without Postgres)."""
        chunks: List[dict] = []
        if not KNOWLEDGE_DIR.exists():
            return chunks

        q = query.lower()
        for path in sorted(KNOWLEDGE_DIR.glob("*.md")):
            text = path.read_text(encoding="utf-8")
            if not q or any(word in text.lower() for word in q.split() if len(word) > 2):
                chunks.append(
                    {
                        "source_file": path.name,
                        "chunk_index": 0,
                        "content": text[:4000],
                        "score": 1.0,
                    }
                )
        return chunks[:TOP_K]

    def format_context(self, chunks: List[dict]) -> str:
        if not chunks:
            return ""
        parts = []
        for c in chunks:
            src = c.get("source_file", "unknown")
            parts.append(f"[Source: {src}]\n{c['content']}")
        return "\n\n---\n\n".join(parts)
