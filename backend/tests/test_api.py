"""Smoke tests for the MedSynth backend (run with: python -m pytest, or directly)."""
from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
SAMPLES = Path(__file__).resolve().parents[2] / "samples"


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["mode"] in ("mock", "api")


def test_summarize_mock():
    text = (SAMPLES / "oncology.txt").read_text(encoding="utf-8")
    r = client.post("/api/summarize", json={
        "paper": {"abstract": text, "title": "Oncology"},
        "mode": "structured", "length": "medium",
    })
    assert r.status_code == 200
    data = r.json()
    assert data["engine"] == "mock"
    assert data["content"]["study_type"]
    assert len(data["content"]["key_findings"]) >= 1
    # Faithfulness: no fabricated numbers.
    assert data["alignment"]["score"] >= 60
    assert data["alignment"]["numeric_overlap"] >= 0.8


def test_summarize_rejects_empty():
    r = client.post("/api/summarize", json={
        "paper": {"abstract": "too short"}, "mode": "concise", "length": "short"})
    assert r.status_code == 422


def test_modes_differ():
    text = (SAMPLES / "diabetes.txt").read_text(encoding="utf-8")
    concise = client.post("/api/summarize", json={
        "paper": {"abstract": text}, "mode": "concise", "length": "short"}).json()
    researcher = client.post("/api/summarize", json={
        "paper": {"abstract": text}, "mode": "researcher", "length": "detailed"}).json()
    # Concise clears methods; researcher keeps them.
    assert concise["content"]["methods"] == []
    assert len(researcher["content"]["methods"]) >= 1


def test_batch_and_compare():
    onc = (SAMPLES / "oncology.txt").read_text(encoding="utf-8")
    card = (SAMPLES / "cardiology.txt").read_text(encoding="utf-8")
    batch = client.post("/api/summarize/batch", json={
        "items": [{"name": "Onc", "abstract": onc}, {"name": "Card", "abstract": card},
                  {"name": "Bad", "abstract": "x"}],
        "mode": "structured", "length": "short",
    }).json()
    assert batch["succeeded"] == 2 and batch["failed"] == 1
    ids = [row["paper_id"] for row in batch["rows"] if row["status"] == "ok"]
    comp = client.post("/api/compare", json={"paper_ids": ids}).json()
    assert len(comp["matrix"]) >= 5
    assert "differences" in comp


def test_feedback():
    r = client.post("/api/feedback", json={
        "overall": 5, "accuracy": 4, "relevance": 5, "completeness": 4})
    assert r.status_code == 200
    assert r.json()["count"] >= 1


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"PASS {name}")
    print("ALL TESTS PASSED")
