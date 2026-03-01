# Runtime (FastAPI)

Python FastAPI runtime for the evolving AI chat desktop app. Provides REST endpoints for chat, storage, settings, and change proposals.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes (for chat) | OpenAI API key for chat completions. If unset, `POST /chat` returns HTTP 503 with `{"error": "api_key_not_set"}`. |

## Running

From `apps/desktop`:

```bash
npm run runtime:fastapi
```

Or directly:

```bash
uv run --with-requirements runtime/requirements.txt python3 -m uvicorn runtime.main:app --host 127.0.0.1 --port 8787
```

## Tests

```bash
uv run --with-requirements runtime/requirements.txt python3 -m unittest runtime.test_proposals runtime.test_chat
```
