# Knowledge layout

| Path | Purpose |
|------|---------|
| `frontend/knowledge/about-me.md` | Brief overview for the **About** page only |
| `frontend/knowledge/chat/*.md` | **Chatbot RAG** — professional CV & projects |
| `frontend/public/data/repos.json` | **Projects page** — local repo list (sync via `npm run sync:repos`) |

```bash
python backend/scripts/sync_knowledge.py
python backend/scripts/index_knowledge.py   # if using pgvector
cd frontend && npm run sync:repos           # refresh repos.json from GitHub
```
