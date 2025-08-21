import os
import subprocess
import tempfile
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from . import github_pr

REPO_ROOT = Path(__file__).resolve().parents[1]
ALLOWED_CMDS = {"test", "lint", "typecheck", "e2e-real"}
MAX_OUTPUT = 100_000
MAX_DIFF_LINES = 800
MAX_DELETES = 20

SENSITIVE_GLOBS = [".env", ".env.", ".github", ".gitlab", ".circleci", "ci", "deploy", "deployment"]


class RunRequest(BaseModel):
    cmd: str


class WriteRequest(BaseModel):
    path: str
    content: str


class GitArgs(BaseModel):
    op: str
    args: dict


app = FastAPI()
app.include_router(github_pr.router)


def _require_token(token: Optional[str]):
    expected = os.getenv("BRIDGE_TOKEN")
    if not expected or token != expected:
        raise HTTPException(status_code=401, detail="invalid token")


def _sandbox_path(path: str) -> Path:
    candidate = (REPO_ROOT / path).resolve()
    if not str(candidate).startswith(str(REPO_ROOT)):
        raise HTTPException(status_code=400, detail="path escape detected")
    if os.getenv("ALLOW_SENSITIVE") != "1":
        name = candidate.name
        for glob in SENSITIVE_GLOBS:
            if glob.startswith('.') and name.startswith(glob):
                raise HTTPException(status_code=400, detail="sensitive file blocked")
            if glob in candidate.parts:
                raise HTTPException(status_code=400, detail="sensitive path blocked")
    return candidate


def _run_command(cmd: List[str]) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    except subprocess.TimeoutExpired as e:
        out = (e.stdout or "") + (e.stderr or "")
        raise HTTPException(status_code=408, detail=out[-MAX_OUTPUT:])


@app.post("/run")
async def run(req: RunRequest, token: str = Header(None, alias="X-Bridge-Token")):
    _require_token(token)
    if req.cmd not in ALLOWED_CMDS:
        raise HTTPException(status_code=400, detail="command not allowed")
    proc = _run_command(["make", req.cmd])
    output = (proc.stdout + proc.stderr)[-MAX_OUTPUT:]
    return {"ok": proc.returncode == 0, "code": proc.returncode, "output_tail": output}


@app.get("/health")
async def health():
    return {"ok": True}


@app.get("/read")
async def read(path: str, token: str = Header(None, alias="X-Bridge-Token")):
    _require_token(token)
    fpath = _sandbox_path(path)
    if not fpath.is_file():
        raise HTTPException(status_code=404, detail="file not found")
    content = fpath.read_text()[:200_000]
    return {"ok": True, "content": content}


@app.post("/write")
async def write(req: WriteRequest, token: str = Header(None, alias="X-Bridge-Token")):
    _require_token(token)
    fpath = _sandbox_path(req.path)
    fpath.parent.mkdir(parents=True, exist_ok=True)
    fpath.write_text(req.content)
    return {"ok": True}


def _check_commit_safety():
    diff = _run_command(["git", "diff", "--cached", "--numstat"]).stdout.strip().splitlines()
    total = 0
    for line in diff:
        parts = line.split('\t')
        if len(parts) >= 2:
            a, d = parts[0], parts[1]
            a = int(a) if a.isdigit() else 0
            d = int(d) if d.isdigit() else 0
            total += a + d
    if total > MAX_DIFF_LINES:
        raise HTTPException(status_code=400, detail="diff too large")
    deletes = _run_command(["git", "diff", "--cached", "--diff-filter=D", "--name-only"]).stdout.strip().splitlines()
    if len(deletes) > MAX_DELETES:
        raise HTTPException(status_code=400, detail="too many deletions")


@app.post("/git")
async def git(req: GitArgs, token: str = Header(None, alias="X-Bridge-Token")):
    _require_token(token)
    op = req.op
    args = req.args
    if op == "branch":
        name = args.get("name")
        create = args.get("create", False)
        cmd = ["git", "checkout"]
        if create:
            cmd.append("-b")
        cmd.append(name)
        proc = _run_command(cmd)
    elif op == "commit":
        message = args.get("message")
        _run_command(["git", "add", "-A"])
        _check_commit_safety()
        proc = _run_command(["git", "commit", "-m", message])
    elif op == "push":
        remote = args.get("remote")
        branch = args.get("branch")
        proc = _run_command(["git", "push", remote, branch])
    else:
        raise HTTPException(status_code=400, detail="git op not allowed")
    output = (proc.stdout + proc.stderr)[-MAX_OUTPUT:]
    return {"ok": proc.returncode == 0, "code": proc.returncode, "output_tail": output}


@app.exception_handler(Exception)
async def handle(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"ok": False, "detail": exc.detail})
    return JSONResponse(status_code=500, content={"ok": False, "detail": str(exc)})
