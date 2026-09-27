"""Deterministic offline summarizer.

Processes the source text with explainable heuristics — it never invents
facts, numbers, or citations. Anything not present becomes the explicit
placeholder "Not stated in the provided abstract."
"""
from __future__ import annotations

import re

from ...models.schemas import SummaryContent, SummaryLength, SummaryMode
from ..extraction import text as T
from ..extraction.terms import UNCERTAINTY_MARKERS
from .base import LENGTH_BUDGET, Summarizer

PLACEHOLDER = T.PLACEHOLDER

_QUESTION_HINTS = ("aim", "objective", "purpose", "to evaluate", "to assess",
                   "to determine", "to investigate", "to examine", "whether",
                   "we sought", "designed to", "hypothes")
_LIMIT_HINTS = ("limitation", "limited by", "small sample", "short follow",
                "single center", "single centre", "generaliz", "generalis",
                "retrospective", "bias", "confound", "not powered")
_CONCLUSION_HINTS = ("conclusion", "in conclusion", "we conclude", "these findings",
                     "our findings", "suggest", "demonstrate", "indicate")


def _first_sentences(sents: list[str], k: int) -> str:
    return " ".join(sents[:k]).strip()


def _pick(sents: list[str], hints: tuple[str, ...]) -> list[str]:
    out = []
    for s in sents:
        low = s.lower()
        if any(h in low for h in hints):
            out.append(s)
    return out


class MockSummarizer(Summarizer):
    name = "mock"

    def summarize(self, source, mode, length):  # type: ignore[override]
        source = (source or "").strip()
        budget = LENGTH_BUDGET[length]
        warnings: list[str] = []

        sents = T.split_sentences(source)
        if not sents:
            return SummaryContent(tldr=PLACEHOLDER), ["Source text could not be parsed into sentences."]

        sections = T.parse_sections(source)
        study_type = T.detect_study_type(source)
        population = T.detect_population(source)
        terms = T.extract_terms(source)
        kw = T.keywords(source, limit=8)

        content = self._build(
            source, sents, sections, study_type, population, terms, kw, mode, length, budget
        )
        # Honesty guardrails: flag if the source is very short.
        if len(source) < 200:
            warnings.append("Short source: heuristic summary may be limited.")
        return content, warnings

    # ── core builder ────────────────────────────────────────────────
    def _build(self, source, sents, sections, study_type, population,
               terms, kw, mode, length, budget) -> SummaryContent:
        results_text = sections.get("results", "")
        bg_text = sections.get("background", "")
        methods_text = sections.get("methods", "")
        concl_text = sections.get("conclusion", "")

        # Background
        background = bg_text or _first_sentences(sents, 2)

        # Research question
        rq_candidates = _pick(sents, _QUESTION_HINTS)
        research_question = rq_candidates[0] if rq_candidates else (
            _first_sentences(sents, 1) if not bg_text else _first_sentences(
                T.split_sentences(bg_text), 1)
        )

        # Methods
        if methods_text:
            method_sents = T.split_sentences(methods_text)
        else:
            method_sents = _pick(sents, ("random", "assigned", "enrolled", "trial",
                                         "cohort", "analysis", "measured", "followed",
                                         "double-blind", "placebo", "method"))
        methods = T.rank_sentences(method_sents, budget["methods"]) if method_sents else []

        # Key findings — prioritise quantitative result sentences.
        if results_text:
            result_sents = T.split_sentences(results_text)
        else:
            result_sents = [s for s in sents if T.extract_numbers(s)] or sents
        key_findings = T.rank_sentences(result_sents, budget["findings"])

        # Conclusion
        if concl_text:
            conclusion = _first_sentences(T.split_sentences(concl_text), 2)
        else:
            concl_c = _pick(sents, _CONCLUSION_HINTS)
            conclusion = concl_c[-1] if concl_c else sents[-1]

        # Limitations — only surface if actually present.
        limit_sents = _pick(sents, _LIMIT_HINTS)
        limitations = T.rank_sentences(limit_sents, budget["limits"]) if limit_sents else [PLACEHOLDER]

        # Source facts (quantitative, verbatim-grounded) vs interpretations (hedged).
        source_facts = [s for s in sents if T.extract_numbers(s)][: budget["findings"]]
        interpretations = [s for s in sents if any(m in s.lower() for m in UNCERTAINTY_MARKERS)][:3]

        # TL;DR — lightly abstractive recombination (not a copied sentence).
        tldr = self._compose_tldr(study_type, terms, kw, key_findings, conclusion, budget)

        # Clinical relevance (clinician mode leans on this).
        clinical_relevance = self._clinical_relevance(conclusion, key_findings, source)

        # Quality notes — transparent caveats derived from the text.
        quality_notes = self._quality_notes(source, key_findings, interpretations, limitations)

        content = SummaryContent(
            title=self._derive_title(sents, terms),
            tldr=tldr,
            background=background or PLACEHOLDER,
            research_question=research_question or PLACEHOLDER,
            study_type=study_type or PLACEHOLDER,
            population=population or PLACEHOLDER,
            methods=methods or [PLACEHOLDER],
            key_findings=key_findings or [PLACEHOLDER],
            conclusion=conclusion or PLACEHOLDER,
            limitations=limitations,
            clinical_relevance=clinical_relevance,
            keywords=kw,
            source_facts=source_facts,
            interpretations=interpretations,
            quality_notes=quality_notes,
            important_terms=terms,
        )
        return self._apply_mode(content, mode)

    # ── helpers ─────────────────────────────────────────────────────
    def _derive_title(self, sents: list[str], terms: list[str]) -> str:
        # Prefer a short leading fragment; fall back to top terms.
        first = sents[0]
        if len(first) <= 120:
            return first.rstrip(".")
        if terms:
            return " / ".join(terms[:3])
        return first[:110].rstrip() + "…"

    def _compose_tldr(self, study_type, terms, kw, key_findings, conclusion, budget) -> str:
        topic = self._pick_topic(terms, kw)
        lead = f"This {study_type.split('(')[0].strip().lower()} " if study_type else "The study "
        parts = [f"{lead}examined {topic}."]
        if key_findings and key_findings[0] != PLACEHOLDER:
            parts.append(self._trim(key_findings[0]))
        if budget["tldr_sents"] >= 2 and conclusion and conclusion != PLACEHOLDER:
            parts.append(self._trim(conclusion))
        if budget["tldr_sents"] >= 3 and len(key_findings) > 1:
            parts.append(self._trim(key_findings[1]))
        text = " ".join(parts[: budget["tldr_sents"] + 1])
        return T.normalize_ws(text)

    def _pick_topic(self, terms: list[str], kw: list[str]) -> str:
        """Choose a subject term, preferring conditions/interventions over
        generic study-design or statistics terms. Falls back to a
        frequency-based keyword when the curated vocabulary has no good match,
        so the TL;DR describes the actual subject rather than a statistic."""
        skip = {
            "randomized controlled trial", "double-blind", "single-blind",
            "placebo-controlled", "cohort study", "case-control", "cross-sectional",
            "meta-analysis", "systematic review", "retrospective", "prospective",
            "observational", "open-label", "crossover", "multicenter", "multicentre",
            "confidence interval", "hazard ratio", "odds ratio", "relative risk",
            "risk ratio", "p-value", "statistical significance", "standard deviation",
            "primary endpoint", "secondary endpoint", "median", "mean",
            "adverse events", "efficacy", "safety", "overall survival",
            "progression-free survival", "quality of life", "mortality",
            "morbidity", "biomarker", "intention-to-treat", "per-protocol",
            "placebo", "control", "control group", "standard care", "usual care",
            "guideline-directed therapy", "matching placebo",
        }

        def is_acronym(t: str) -> bool:
            # Short tokens with no lowercase letters (CI, HR, RR, RFS, RCT, OS)
            # are statistics/measures, not good sentence subjects.
            letters = [ch for ch in t if ch.isalpha()]
            return len(t) <= 5 and bool(letters) and not any(ch.islower() for ch in letters)

        for t in terms:
            if t.lower() not in skip and not is_acronym(t):
                return t
        # No descriptive curated term — use the top data-driven keyword.
        for k in kw:
            if k.lower() not in skip and len(k) > 3:
                return k
        if terms:
            return terms[0]
        return kw[0] if kw else "the intervention"

    def _trim(self, s: str, max_words: int = 40) -> str:
        words = s.split()
        if len(words) <= max_words:
            return s
        return " ".join(words[:max_words]).rstrip(",.;") + "…"

    def _clinical_relevance(self, conclusion, key_findings, source) -> str:
        if not T.has_uncertainty(source) and not key_findings:
            return PLACEHOLDER
        base = conclusion if conclusion and conclusion != PLACEHOLDER else (
            key_findings[0] if key_findings else "")
        if not base:
            return PLACEHOLDER
        return (
            f"[FROM SOURCE] {self._trim(base)} "
            "[AI INTERPRETATION] These results describe the studied population only; "
            "the provided abstract alone does not establish broader clinical effectiveness "
            "or a treatment recommendation."
        )

    def _quality_notes(self, source, key_findings, interpretations, limitations) -> list[str]:
        notes: list[str] = []
        if T.extract_numbers(source):
            notes.append("Quantitative results were detected and preserved verbatim from the source.")
        else:
            notes.append("No numeric results were detected in the source text.")
        if interpretations:
            notes.append("Source contains hedged/uncertain language; findings are not stated as definitive.")
        if limitations and limitations[0] != PLACEHOLDER:
            notes.append("Author-stated limitations were identified in the source.")
        else:
            notes.append("No explicit limitations were stated in the provided abstract.")
        return notes

    def _apply_mode(self, c: SummaryContent, mode: SummaryMode) -> SummaryContent:
        """Emphasise fields per mode; de-emphasised fields are cleared to keep
        the payload honest and the UI focused (frontend renders by mode too)."""
        if mode == SummaryMode.concise:
            c.methods = []
            c.limitations = []
            c.clinical_relevance = ""
            c.background = ""
        elif mode == SummaryMode.clinician:
            c.background = ""
            # keep clinical_relevance, population, key_findings, conclusion
        elif mode == SummaryMode.researcher:
            c.clinical_relevance = ""
            # keep study_type, methods, limitations, quality_notes (research gaps)
        # structured keeps everything
        return c
