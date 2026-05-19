# Portfolio RAG API

FastAPI service for streaming chat with **RAG** (pgvector) and **Ollama** inference.

## Quick start (local)

```bash
# From repo root
cp env.example .env

cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

docker compose up -d   # Postgres + Redis

python scripts/sync_knowledge.py
python scripts/index_knowledge.py
python run_server.py
```

API: http://localhost:8000/docs

## Knowledge pipeline

1. Edit canonical files in `../frontend/knowledge/*.md`
2. `python scripts/sync_knowledge.py` → copies to `backend/knowledge/`
3. `python scripts/index_knowledge.py` → embeds chunks into Postgres

## Environment

See root [`env.example`](../env.example). Key variables:

| Variable | Purpose |
|----------|---------|
| `LLM_PROVIDER` | `ollama` (default) or `openai_compatible` |
| `OLLAMA_BASE_URL` | Ollama HTTP API |
| `OLLAMA_CHAT_MODEL` | Chat model name |
| `OLLAMA_EMBED_MODEL` | Embedding model |
| `DATABASE_URL` | Postgres connection (or `POSTGRES_*`) |
| `RAG_TOP_K` | Chunks retrieved per query |

## Fly.io deployment

```bash
fly launch --no-deploy   # first time
fly secrets set OLLAMA_BASE_URL=http://... FRONTEND_URL=https://zivdev.netlify.app
fly secrets set DATABASE_URL=postgresql://...
fly deploy
```

Ensure Ollama is reachable from the app (sidecar, same VM, or private network).

## Docker Compose

`docker compose up -d` starts Postgres (pgvector) and Redis.

## Legacy note

The old Gemini + Vercel stack is in `../BackendV2/` (deprecated).
