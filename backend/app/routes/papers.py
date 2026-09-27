"""Paper management + file upload endpoints."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from ..models.schemas import Paper
from ..services.store import store

router = APIRouter(prefix="/api", tags=["papers"])


@router.get("/papers", response_model=list[Paper])
def list_papers() -> list[Paper]:
    return store.list_papers()


@router.get("/papers/{paper_id}", response_model=Paper)
def get_paper(paper_id: str) -> Paper:
    paper = store.get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found.")
    return paper


@router.delete("/papers/{paper_id}")
def delete_paper(paper_id: str) -> dict[str, bool]:
    if not store.delete_paper(paper_id):
        raise HTTPException(status_code=404, detail="Paper not found.")
    return {"deleted": True}


@router.post("/upload", response_model=list[Paper])
async def upload_files(files: list[UploadFile] = File(...)) -> list[Paper]:
    """Accept one or more .txt files and register them as papers (not summarized yet)."""
    created: list[Paper] = []
    for f in files:
        name = (f.filename or "upload.txt")
        if not name.lower().endswith(".txt"):
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type: {name}. Only .txt files are supported.",
            )
        raw = await f.read()
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            try:
                text = raw.decode("latin-1")
            except Exception:
                raise HTTPException(
                    status_code=400, detail=f"Could not read {name} as text.")
        if not text.strip():
            raise HTTPException(status_code=400, detail=f"{name} is empty.")
        paper = store.add_paper(Paper(
            id=str(uuid.uuid4()),
            title=name.rsplit(".", 1)[0],
            abstract=text.strip(),
            source="upload",
        ))
        created.append(paper)
    return created
