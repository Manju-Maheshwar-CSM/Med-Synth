"""Deterministic text parsing utilities: sentences, numbers, sections, terms."""
from __future__ import annotations

import re
from collections import Counter

from .terms import (
    KNOWN_ACRONYMS,
    MEDICAL_TERMS,
    STUDY_TYPE_HINTS,
    UNCERTAINTY_MARKERS,
)

# Section headers commonly found in structured abstracts.
_SECTION_ALIASES: dict[str, list[str]] = {
    "background": ["background", "introduction", "context", "objective",
                   "objectives", "aim", "aims", "purpose", "importance"],
    "methods": ["methods", "method", "design", "materials and methods",
                "study design", "setting", "participants", "intervention",
                "interventions", "measurements"],
    "results": ["results", "result", "findings", "main outcomes",
                "outcomes", "main results"],
    "conclusion": ["conclusion", "conclusions", "interpretation",
                   "discussion", "clinical relevance"],
}

_ABBREV = {"dr.", "vs.", "e.g.", "i.e.", "fig.", "no.", "et al.", "approx.",
           "mg.", "ml.", "kg.", "cf.", "ca."}

PLACEHOLDER = "Not stated in the provided abstract."


def normalize_ws(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip())


def split_sentences(text: str) -> list[str]:
    """Lightweight, abbreviation-aware sentence splitter."""
    text = normalize_ws(text)
    if not text:
        return []
    # Protect common abbreviations from being treated as sentence ends.
    protected = text
    for ab in _ABBREV:
        protected = protected.replace(ab, ab.replace(".", "<DOT>"))
    # Protect decimals like 3.14 and p<0.05
    protected = re.sub(r"(\d)\.(\d)", r"\1<DOT>\2", protected)
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9])", protected)
    out = []
    for p in parts:
        s = p.replace("<DOT>", ".").strip()
        if len(s) > 2:
            out.append(s)
    return out


# ── Numeric extraction ──────────────────────────────────────────────
_NUM_PATTERNS = [
    r"[pP]\s*[<>=≤≥]\s*0?\.\d+",            # p-values
    r"\d+(?:\.\d+)?\s*%",                     # percentages
    r"\bn\s*=\s*\d[\d,]*",                    # sample sizes
    r"95\s*%?\s*CI[^.,;]*",                   # confidence intervals
    r"\b(?:HR|OR|RR)\s*[=:]?\s*\d+(?:\.\d+)?",  # ratios
    r"\d+(?:\.\d+)?\s*(?:mg|mmHg|kg|ml|mmol/L|mg/dL|months?|weeks?|days?|years?)",
    r"\b\d+(?:,\d{3})+(?:\.\d+)?\b",         # large numbers with commas
    r"\b\d+(?:\.\d+)?\b",                     # bare numbers (fallback)
]
_NUM_RE = re.compile("|".join(f"(?:{p})" for p in _NUM_PATTERNS))


def _canonical_number(token: str) -> str:
    """Normalize a numeric token for comparison (lowercase, collapse spaces)."""
    return re.sub(r"\s+", "", token.lower().replace(",", ""))


def extract_numbers(text: str) -> list[str]:
    """Return significant numeric expressions in order of appearance (deduped)."""
    seen: set[str] = set()
    out: list[str] = []
    for m in _NUM_RE.finditer(text or ""):
        tok = m.group(0).strip()
        canon = _canonical_number(tok)
        # Drop trivial standalone integers 0-2 (often not meaningful stats)
        if re.fullmatch(r"\d", canon):
            continue
        if canon and canon not in seen:
            seen.add(canon)
            out.append(tok)
    return out


def numeric_key_set(text: str) -> set[str]:
    """Set of canonical numeric tokens for overlap scoring."""
    return {_canonical_number(t) for t in extract_numbers(text)}


# ── Term extraction ─────────────────────────────────────────────────
def _titlecase_term(term: str) -> str:
    special = {
        "rct": "Randomized Controlled Trial", "hba1c": "HbA1c",
        "ldl": "LDL", "hdl": "HDL", "bmi": "BMI", "copd": "COPD",
        "covid-19": "COVID-19", "sars-cov-2": "SARS-CoV-2",
        "ace inhibitor": "ACE Inhibitor", "qol": "Quality of Life",
    }
    if term in special:
        return special[term]
    return " ".join(w.capitalize() for w in term.split())


def extract_terms(text: str, limit: int = 14) -> list[str]:
    """Surface medical terms/acronyms that literally appear in the text."""
    low = (text or "").lower()
    found: list[str] = []
    seen: set[str] = set()
    # Multi-word phrases first (longest match wins for display).
    for term in sorted(MEDICAL_TERMS, key=len, reverse=True):
        if term in low:
            display = _titlecase_term(term)
            key = display.lower()
            if key not in seen:
                seen.add(key)
                found.append(display)
    # Known acronyms (word-boundary, case-sensitive).
    for acr in KNOWN_ACRONYMS:
        if re.search(rf"\b{re.escape(acr)}\b", text or ""):
            if acr.lower() not in seen:
                seen.add(acr.lower())
                found.append(acr)
    return found[:limit]


def detect_study_type(text: str) -> str:
    low = (text or "").lower()
    for hint, label in STUDY_TYPE_HINTS.items():
        if hint in low:
            return label
    if re.search(r"\brct\b", low):
        return "Randomized Controlled Trial (RCT)"
    return ""


# ── Section parsing ─────────────────────────────────────────────────
def parse_sections(text: str) -> dict[str, str]:
    """Detect labelled sections (Background/Methods/Results/Conclusion).

    Returns a dict; missing sections are simply absent.
    """
    text = (text or "").strip()
    sections: dict[str, str] = {}
    # Build a regex that matches any known header followed by ':' or newline.
    all_aliases = [(canon, alias) for canon, aliases in _SECTION_ALIASES.items()
                   for alias in aliases]
    all_aliases.sort(key=lambda x: len(x[1]), reverse=True)
    pattern = re.compile(
        r"(?im)^\s*(" + "|".join(re.escape(a) for _, a in all_aliases)
        + r")\s*[:\.\-]\s*"
    )
    matches = list(pattern.finditer(text))
    if not matches:
        return sections
    alias_to_canon = {a.lower(): c for c, a in all_aliases}
    for i, m in enumerate(matches):
        canon = alias_to_canon[m.group(1).lower()]
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = normalize_ws(text[start:end])
        if body and canon not in sections:
            sections[canon] = body
    return sections


# ── Sentence ranking (extractive support for abstractive summaries) ──
_STOPWORDS = set(
    "the a an and or of to in for with on at by from as is are was were be been "
    "this that these those we our their its it they he she which who whom whose "
    "study patients group groups compared using between among within also than "
    "showed found reported observed results conclusion background methods".split()
)


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z][a-zA-Z\-]+", (text or "").lower())


def rank_sentences(sentences: list[str], top_k: int) -> list[str]:
    """Frequency-based extractive ranking; sentences with numbers get a boost.

    Returns the top_k sentences in their *original order* (stable, deterministic).
    """
    if not sentences:
        return []
    freq = Counter(
        w for s in sentences for w in _tokenize(s) if w not in _STOPWORDS and len(w) > 2
    )
    if not freq:
        return sentences[:top_k]
    max_f = max(freq.values())
    scored: list[tuple[int, float]] = []
    for idx, s in enumerate(sentences):
        words = [w for w in _tokenize(s) if w in freq]
        base = sum(freq[w] for w in words) / (len(words) + 1)
        base /= max_f
        if extract_numbers(s):
            base += 0.35  # prioritise quantitative sentences
        if idx == 0:
            base += 0.15  # topic sentence bias
        scored.append((idx, base))
    top_idx = sorted(sorted(scored, key=lambda x: x[1], reverse=True)[:top_k])
    return [sentences[i] for i, _ in top_idx]


def keywords(text: str, limit: int = 10) -> list[str]:
    freq = Counter(
        w for w in _tokenize(text) if w not in _STOPWORDS and len(w) > 3
    )
    return [w for w, _ in freq.most_common(limit)]


def detect_population(text: str) -> str:
    """Heuristically pull the population sentence.

    Prefers sentences that state an explicit sample size (n=) or enrollment,
    which is the most informative population descriptor in an abstract.
    """
    sents = split_sentences(text)
    # 1) Sentences with an explicit sample size.
    for s in sents:
        if re.search(r"\bn\s*=\s*\d", s.lower()):
            return s
    # 2) Sentences describing randomization / enrollment of people.
    for s in sents:
        low = s.lower()
        if re.search(r"\b(randomi[sz]ed|enrolled|assigned|recruited)\b", low) and \
           re.search(r"\b(patients|participants|adults|children|subjects|women|men)\b", low):
            return s
    # 3) Any sentence naming a study population together with a number.
    for s in sents:
        low = s.lower()
        if re.search(r"\b(patients|participants|adults|children|subjects)\b", low) and re.search(r"\d", s):
            return s
    return ""


def has_uncertainty(text: str) -> bool:
    low = (text or "").lower()
    return any(m in low for m in UNCERTAINTY_MARKERS)
