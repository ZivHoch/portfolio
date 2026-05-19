import hashlib
import re
from pathlib import Path
from typing import List

from app.logic.embeddings import EmbeddingClient


def chunk_markdown(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    """Split markdown into overlapping chunks by character count."""
    text = text.strip()
    if not text:
        return []

    chunks: List[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = max(0, end - overlap)

    return chunks


def calculate_content_hash(content: str) -> str:
    return hashlib.md5(content.encode("utf-8")).hexdigest()


class DocumentIndexer:
    def __init__(self, embeddings: EmbeddingClient | None = None):
        self.embeddings = embeddings or EmbeddingClient()

    def process_file(self, file_path: Path) -> List[dict]:
        content = file_path.read_text(encoding="utf-8")
        content_hash = calculate_content_hash(content)
        source_file = file_path.name

        records = []
        for idx, chunk in enumerate(chunk_markdown(content)):
            embedding = self.embeddings.embed_query(chunk)
            records.append(
                {
                    "source_file": source_file,
                    "chunk_index": idx,
                    "content": chunk,
                    "content_hash": content_hash,
                    "embedding": embedding,
                }
            )
        return records

    def walk_knowledge_dir(self, knowledge_dir: Path) -> List[dict]:
        """Index chat/*.md only (excludes brief about-me.md used for the About page)."""
        all_records: List[dict] = []
        chat_dir = knowledge_dir / "chat"
        search_root = chat_dir if chat_dir.is_dir() else knowledge_dir
        for path in sorted(search_root.glob("*.md")):
            all_records.extend(self.process_file(path))
        return all_records
