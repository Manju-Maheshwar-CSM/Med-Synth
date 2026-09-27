"""MedSynth FastAPI application entrypoint."""
from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .routes import core, papers, summarize

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medsynth")

settings = get_settings()

app = FastAPI(
    title="MedSynth API",
    description="AI Medical Literature Summarization — faithful, source-grounded summaries.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(summarize.router)
app.include_router(papers.router)
app.include_router(core.router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Never leak raw stack traces to clients."""
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong on the server. Please try again."},
    )


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    return {
        "name": "MedSynth API",
        "docs": "/docs",
        "health": "/api/health",
        "mode": settings.effective_mode,
    }
