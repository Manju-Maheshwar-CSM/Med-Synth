"""PubMed E-utilities client. Normalizes results into the internal Paper model."""
from __future__ import annotations

import uuid
import xml.etree.ElementTree as ET

import httpx

from ...config import get_settings
from ...models.schemas import Paper

_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


class PubMedError(Exception):
    """User-friendly PubMed failure."""


def _common_params() -> dict[str, str]:
    s = get_settings()
    params = {"tool": "MedSynth", "db": "pubmed"}
    if s.pubmed_email:
        params["email"] = s.pubmed_email
    if s.pubmed_api_key:
        params["api_key"] = s.pubmed_api_key
    return params


def _text(el: ET.Element | None) -> str:
    if el is None:
        return ""
    return "".join(el.itertext()).strip()


def _parse_article(article: ET.Element, pmid: str) -> Paper:
    title = _text(article.find(".//ArticleTitle"))
    # Abstract may have multiple labelled sections.
    abstract_parts: list[str] = []
    for ab in article.findall(".//Abstract/AbstractText"):
        label = ab.get("Label")
        body = _text(ab)
        if not body:
            continue
        abstract_parts.append(f"{label}: {body}" if label else body)
    abstract = "\n".join(abstract_parts)

    authors: list[str] = []
    for a in article.findall(".//AuthorList/Author"):
        last = _text(a.find("LastName"))
        initials = _text(a.find("Initials"))
        if last:
            authors.append(f"{last} {initials}".strip())
    journal = _text(article.find(".//Journal/Title"))
    year = _text(article.find(".//JournalIssue/PubDate/Year"))
    month = _text(article.find(".//JournalIssue/PubDate/Month"))
    pub_date = " ".join(x for x in (month, year) if x)

    return Paper(
        id=str(uuid.uuid4()),
        title=title or "Untitled abstract",
        authors=authors,
        journal=journal,
        publication_date=pub_date,
        pmid=pmid,
        abstract=abstract,
        source="pubmed",
    )


def fetch_pmid(pmid: str) -> Paper:
    pmid = pmid.strip()
    if not pmid.isdigit():
        raise PubMedError("A PMID must be numeric (e.g. 25760099).")
    params = _common_params() | {"id": pmid, "retmode": "xml"}
    try:
        with httpx.Client(timeout=20.0) as client:
            resp = client.get(f"{_BASE}/efetch.fcgi", params=params)
    except httpx.HTTPError as exc:
        raise PubMedError(f"Could not reach PubMed: {exc}") from exc
    if resp.status_code == 429:
        raise PubMedError("PubMed is rate-limiting requests. Try again shortly.")
    if resp.status_code >= 400:
        raise PubMedError(f"PubMed returned an error ({resp.status_code}).")
    try:
        root = ET.fromstring(resp.text)
    except ET.ParseError as exc:
        raise PubMedError("Could not parse the PubMed response.") from exc
    article = root.find(".//PubmedArticle")
    if article is None:
        raise PubMedError(f"No PubMed record found for PMID {pmid}.")
    paper = _parse_article(article, pmid)
    if not paper.abstract:
        paper.abstract = ""
        raise PubMedError(f"PMID {pmid} was found but has no abstract available.")
    return paper


def search(term: str, retmax: int = 10) -> list[dict[str, str]]:
    term = term.strip()
    if not term:
        raise PubMedError("Enter a search term.")
    params = _common_params() | {"term": term, "retmax": str(retmax), "retmode": "json"}
    try:
        with httpx.Client(timeout=20.0) as client:
            resp = client.get(f"{_BASE}/esearch.fcgi", params=params)
            if resp.status_code >= 400:
                raise PubMedError(f"PubMed search failed ({resp.status_code}).")
            ids = resp.json().get("esearchresult", {}).get("idlist", [])
            if not ids:
                return []
            sum_params = _common_params() | {"id": ",".join(ids), "retmode": "json"}
            sresp = client.get(f"{_BASE}/esummary.fcgi", params=sum_params)
            data = sresp.json().get("result", {})
    except httpx.HTTPError as exc:
        raise PubMedError(f"Could not reach PubMed: {exc}") from exc
    except ValueError as exc:
        raise PubMedError("Could not parse the PubMed search response.") from exc

    out: list[dict[str, str]] = []
    for pid in ids:
        item = data.get(pid, {})
        authors = ", ".join(a.get("name", "") for a in item.get("authors", [])[:3])
        out.append({
            "pmid": pid,
            "title": item.get("title", "").rstrip("."),
            "journal": item.get("fulljournalname", "") or item.get("source", ""),
            "pubdate": item.get("pubdate", ""),
            "authors": authors,
        })
    return out
