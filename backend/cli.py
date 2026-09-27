"""MedSynth command-line interface.

Uses the SAME summarization service as the web API (no duplicated logic).

Examples:
    python cli.py --file ../samples/oncology.txt
    python cli.py --file ../samples/oncology.txt --mode concise --length short
    python cli.py --pmid 25760099
    python cli.py --text "Background: ..."
"""
from __future__ import annotations

import argparse
import sys
import uuid
from pathlib import Path

from app.models.schemas import SummaryLength, SummaryMode
from app.services.summarization.service import summarize_text


def _print_section(title: str, body: str | list[str]) -> None:
    print(f"\n\033[1m{title}\033[0m")
    if isinstance(body, list):
        if not body:
            print("  —")
        for item in body:
            print(f"  • {item}")
    else:
        print(f"  {body or '—'}")


def main() -> int:
    parser = argparse.ArgumentParser(description="MedSynth medical literature summarizer")
    src = parser.add_mutually_exclusive_group(required=True)
    src.add_argument("--file", help="Path to a .txt abstract/paper")
    src.add_argument("--text", help="Raw abstract text")
    src.add_argument("--pmid", help="PubMed ID to fetch and summarize")
    parser.add_argument("--mode", choices=[m.value for m in SummaryMode],
                        default="structured")
    parser.add_argument("--length", choices=[l.value for l in SummaryLength],
                        default="medium")
    args = parser.parse_args()

    if args.file:
        path = Path(args.file)
        if not path.exists():
            print(f"Error: file not found: {path}", file=sys.stderr)
            return 1
        source = path.read_text(encoding="utf-8", errors="replace")
        title = path.stem
    elif args.text:
        source, title = args.text, "CLI input"
    else:
        from app.services.pubmed import PubMedError, fetch_pmid
        try:
            paper = fetch_pmid(args.pmid)
        except PubMedError as exc:
            print(f"PubMed error: {exc}", file=sys.stderr)
            return 1
        source, title = paper.abstract, paper.title
        print(f"Fetched PMID {args.pmid}: {title}")

    if not source.strip():
        print("Error: empty source text.", file=sys.stderr)
        return 1

    result = summarize_text(
        source, SummaryMode(args.mode), SummaryLength(args.length), str(uuid.uuid4())
    )
    c = result.content

    print("\n" + "=" * 64)
    print(f"  MedSynth summary  ·  mode={args.mode}  length={args.length}  engine={result.engine}")
    print("=" * 64)
    _print_section("TL;DR", c.tldr)
    if c.study_type:
        _print_section("Study Type", c.study_type)
    if c.population:
        _print_section("Population", c.population)
    _print_section("Key Findings", c.key_findings)
    if c.methods:
        _print_section("Methods", c.methods)
    _print_section("Conclusion", c.conclusion)
    if c.limitations:
        _print_section("Limitations", c.limitations)
    if c.important_terms:
        _print_section("Important Terms", ", ".join(c.important_terms))
    _print_section(
        f"Source Alignment ({result.alignment.band})", f"{result.alignment.score}%"
    )
    for s in result.alignment.signals:
        print(f"    - {s}")
    for w in result.warnings:
        print(f"\n  ⚠ {w}")
    print("\n  Note: heuristic source-alignment indicator, not a validated accuracy score.")
    print("  MedSynth summarizes literature and is not a substitute for clinical judgment.\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
