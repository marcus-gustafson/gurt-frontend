import os
import pytest
from openai import OpenAI


def test_chat_round_trip():
    base_url = os.getenv("OPENAI_BASE_URL", "http://127.0.0.1:8080")
    api_key = os.getenv("OPENAI_API_KEY", "sk-local-dummy")
    client = OpenAI(base_url=base_url, api_key=api_key)
    resp = client.chat.completions.create(
        model="gpt-oss-20b",
        messages=[{"role": "user", "content": "Hello"}],
        temperature=0,
        max_tokens=10,
    )
    assert resp.choices[0].message.content.strip()
