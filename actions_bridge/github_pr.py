import os
import re
import subprocess
from fastapi import APIRouter, HTTPException
import requests

router = APIRouter()


def _repo_slug() -> str:
    url = subprocess.run(["git", "remote", "get-url", "origin"], text=True, capture_output=True, check=True).stdout.strip()
    m = re.search(r"github\.com[:/](.+?/.+?)(?:\.git)?$", url)
    if not m:
        raise HTTPException(status_code=500, detail="cannot parse repo slug")
    return m.group(1)


def _default_base() -> str:
    try:
        out = subprocess.run([
            "git",
            "symbolic-ref",
            "--short",
            "refs/remotes/origin/HEAD",
        ], text=True, capture_output=True, check=True).stdout.strip()
        return out.split("/", 1)[1]
    except subprocess.CalledProcessError:
        return "main"


@router.post("/github/pr")
def open_pr(payload: dict):
    token = os.getenv("GH_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="GH_TOKEN missing")
    head = payload.get("head")
    if not head:
        raise HTTPException(status_code=400, detail="head branch required")
    title = payload.get("title") or "Codex: update"
    body = payload.get("body") or "Automated PR from actions bridge"
    base = payload.get("base") or _default_base()
    slug = _repo_slug()
    r = requests.post(
        f"https://api.github.com/repos/{slug}/pulls",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
        },
        json={
            "title": title,
            "body": body,
            "head": head,
            "base": base,
            "maintainer_can_modify": True,
        },
        timeout=30,
    )
    if r.status_code >= 300:
        raise HTTPException(status_code=r.status_code, detail=f"GitHub error: {r.text}")
    return r.json()
