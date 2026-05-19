#!/usr/bin/env python3
"""Index markdown knowledge into pgvector. Run sync_knowledge.py first."""
import os
import sys
from pathlib import Path

# Allow running as script from repo root or backend/
BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from dotenv import load_dotenv

load_dotenv(BACKEND_ROOT.parent / ".env")
load_dotenv(BACKEND_ROOT / ".env")

from app.db.database import get_connection, init_schema, is_database_configured
from app.logic.document_indexer import DocumentIndexer


def upsert_chunks(records: list) -> None:
    sql = """
        INSERT INTO knowledge_chunks
            (source_file, chunk_index, content, content_hash, embedding)
        VALUES (%s, %s, %s, %s, %s::vector)
        ON CONFLICT (source_file, chunk_index)
        DO UPDATE SET
            content = EXCLUDED.content,
            content_hash = EXCLUDED.content_hash,
            embedding = EXCLUDED.embedding,
            created_at = NOW()
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            for rec in records:
                emb = rec["embedding"]
                vector_literal = "[" + ",".join(str(x) for x in emb) + "]"
                cur.execute(
                    sql,
                    (
                        rec["source_file"],
                        rec["chunk_index"],
                        rec["content"],
                        rec["content_hash"],
                        vector_literal,
                    ),
                )


def main() -> None:
    if not is_database_configured():
        raise SystemExit("DATABASE_URL or POSTGRES_* env vars are required")

    knowledge_dir = Path(
        os.getenv("KNOWLEDGE_DIR", str(BACKEND_ROOT / "knowledge"))
    )
    if not knowledge_dir.exists():
        raise SystemExit(
            f"Knowledge dir not found: {knowledge_dir}. Run scripts/sync_knowledge.py first."
        )

    print("Initializing schema...")
    init_schema()

    indexer = DocumentIndexer()
    records = indexer.walk_knowledge_dir(knowledge_dir)
    print(f"Indexed {len(records)} chunks from {knowledge_dir}")
    upsert_chunks(records)
    print("Done.")


if __name__ == "__main__":
    main()
