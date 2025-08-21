# Actions Bridge

A small FastAPI bridge exposing limited repository commands for GPT Actions.

## Running

```bash
pipenv install --dev || pipenv install
uvicorn actions_bridge.bridge:app --host 127.0.0.1 --port 8000
```

Set `BRIDGE_TOKEN` in the environment or via `.env` to authenticate requests.
To open pull requests via `/github/pr`, set `GH_TOKEN` with a GitHub Personal
Access Token (`public_repo` or `repo` scope).

## Endpoints

* `POST /run` – run `make` targets (`test`, `lint`, `typecheck`, `e2e-real`).
* `GET /read` – read a repo file (200k char cap).
* `POST /write` – create/overwrite a repo file.
* `POST /git` – limited git operations (`branch`, `commit`, `push`).
* `POST /github/pr` – open a pull request using `GH_TOKEN`.

All requests must include header `X-Bridge-Token` with the shared secret.

Paths are sandboxed to the repository root and `.env*`, deployment manifests and CI files are blocked unless `ALLOW_SENSITIVE=1`.

Outputs are truncated to the last 100k characters and commands timeout after ~10 minutes.

## Tunnel

Expose the bridge with a quick tunnel such as Cloudflare Tunnel or Tailscale Funnel:

```
cloudflared tunnel --url http://127.0.0.1:8000
```

Only the bridge is exposed; the model stays bound to `127.0.0.1:8080`. Keep `BRIDGE_TOKEN` secret and rotate it if compromised.
