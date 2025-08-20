# Gurt — Local‑first chat UI (MVP)

Talk to your **local LLM** via a clean Next.js app. No Ollama. Works with any **OpenAI‑compatible** server (e.g., `llama.cpp --server`, **LM Studio** local server).

## Quick start (Windows‑first)

1) **Start your local model server**

### Option A — llama.cpp (OpenAI‑compatible server)
```powershell
# Adjust paths/model as needed (any GGUF works)
B:\src\llama.cpp\build\bin\Release\llama-server.exe -m B:\models\gpt-oss-20b\gpt-oss-20b.f16.gguf --ctx-size 8192 --n-gpu-layers 18 --host 127.0.0.1 --port 8080
```
This exposes `http://localhost:8080/v1`.

### Option B — LM Studio
- Open LM Studio → **Start Local Server**.  
- Default URL is `http://localhost:1234/v1`.

> The app auto‑detects 8080 first, then 1234. You can override in Settings or `.env`.

2) **Install & run Gurt**
```powershell
# Node.js LTS required
npm i
npm run dev
# open http://localhost:3000
```

## Features
- Streaming responses end‑to‑end
- Modern chat UI (dark by default), markdown rendering
- Settings drawer: model, temperature, system prompt, base URL override (persisted)
- Sessions: new chat, export/import JSON
- Health endpoint: auto‑detects backend & lists models

## Configuration
Create `.env` (optional):
```
OPENAI_BASE_URL=           # default: autodetect 8080 → 1234
OPENAI_API_KEY=            # optional for local servers
MODEL_ID=oss-20b           # default model; change in UI
DEFAULT_SYSTEM_PROMPT=You are Gurt, a private, local-first assistant...
```

We also expose *defaults* client‑side for first load:
```
NEXT_PUBLIC_MODEL_ID=oss-20b
NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT=You are Gurt, a private, local-first assistant...
```

## Troubleshooting
- **No local LLM detected**: Start your server. Try `http://localhost:8080/v1` or `http://localhost:1234/v1` in Settings.
- **Model not found**: Ensure your server has the model loaded (`/v1/models` should list it).
- **Streaming stalls**: Some servers pause if context is too large. Reduce message history or `-c` in llama.cpp.
- **CORS**: Calls go server→server from the Next API route, so CORS is typically not an issue.
- **Port already in use**: Change `--port`, then set the URL override in Settings.

## Remote access (optional; security note)
You can expose the Next app or your model server via **Cloudflare Tunnel** or **Tailscale**. Be careful: exposing a model server publicly can be risky—prefer private tunnels and ACLs.

## License
MIT
