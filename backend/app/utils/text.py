"""Text validation helpers shared across routes."""
from __future__ import annotations

MIN_CHARS = 40
MAX_CHARS = 200_000


def validate_abstract(text: str) -> tuple[bool, str]:
    """Return (is_valid, message)."""
    if text is None:
        return False, "No abstract provided."
    stripped = text.strip()
    if not stripped:
        return False, "The abstract is empty. Paste or load some text first."
    if len(stripped) < MIN_CHARS:
        return False, (
            f"The abstract is very short ({len(stripped)} characters). "
            "Please provide at least a full abstract for a meaningful summary."
        )
    if len(stripped) > MAX_CHARS:
        return False, (
            "The text is extremely long. Please provide a single abstract or paper "
            "(under ~200,000 characters)."
        )
    return True, ""
