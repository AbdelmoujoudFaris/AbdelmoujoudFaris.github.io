#!/usr/bin/env python3
"""
update_publications.py — publication metadata maintenance for this portfolio.

Sources (all public, documented APIs, no credentials):
  * ORCID      https://pub.orcid.org/v3.0/{ORCID}/works          (discovery)
  * Crossref   https://api.crossref.org/works/{DOI}              (authors, journal, abstract)
  * Unpaywall  https://api.unpaywall.org/v2/{DOI}?email=...      (open-access status)

Outputs (idempotent, regenerate any time):
  _data/publications.yml            canonical metadata (Jekyll data file)
  assets/data/publications.json     dataset consumed by the publications chapter
  _publications/<year>-<slug>.md    AcademicPages collection entries (/publications/)
  files/publications/*.pdf          only permissively-licensed open-access PDFs
  files/publications/licences.json  provenance + licence record for hosted PDFs

Commands:
  python scripts/update_publications.py --discover
  python scripts/update_publications.py --verify
  python scripts/update_publications.py --download-open-access
  python scripts/update_publications.py --build
  python scripts/update_publications.py --check
  python scripts/update_publications.py --all

Only PDFs whose licence is redistributable (CC0, CC BY, public domain) are
downloaded and committed.  Everything else keeps a citation + official link.
"""

import argparse
import hashlib
import json
import re
import socket
import sys
import time
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

socket.setdefaulttimeout(25)

ROOT = Path(__file__).resolve().parent.parent
ORCID_ID = "0000-0003-0781-6523"
CONTACT_EMAIL = "abdelmoujoud.faris@usmba.ac.ma"   # required by Unpaywall API
STATE_FILE = ROOT / "scripts" / "publications_state.json"
DATA_YML = ROOT / "_data" / "publications.yml"
DATA_JSON = ROOT / "assets" / "data" / "publications.json"
PUB_DIR = ROOT / "_publications"
PDF_DIR = ROOT / "files" / "publications"
LICENCES_JSON = PDF_DIR / "licences.json"
PROFILE_URL = "https://www.researchgate.net/profile/Abdelmoujoud-Faris"
UA = {"User-Agent": "portfolio-pubs/1.0 (mailto:%s)" % CONTACT_EMAIL}

REDISTRIBUTABLE = {"cc-by", "cc0", "public-domain", "pd"}

CATEGORIES = [
    "Cheminformatics & QSAR",
    "Computer-Aided Drug Design",
    "Molecular Dynamics & Free Energy",
    "Machine Learning & AI",
    "Bioinformatics & Omics",
]

# Manual category assignment by DOI (content-based, not title-only heuristics).
CATEGORY_BY_DOI = {
    "10.1016/j.bioorg.2026.110587": "Computer-Aided Drug Design",
    "10.1080/14756366.2025.2596488": "Computer-Aided Drug Design",
    "10.1142/s2737416525500048": "Cheminformatics & QSAR",
    "10.1080/07391102.2023.2283168": "Cheminformatics & QSAR",
    "10.2174/1570180820666230821102836": "Computer-Aided Drug Design",
    "10.3389/fchem.2024.1384832": "Computer-Aided Drug Design",
    "10.1080/07391102.2023.2270709": "Computer-Aided Drug Design",
    "10.1080/07391102.2023.2220829": "Computer-Aided Drug Design",
    "10.3390/molecules29010023": "Computer-Aided Drug Design",
    "10.3389/fchem.2024.1425220": "Computer-Aided Drug Design",
    "10.3389/fchem.2024.1473398": "Computer-Aided Drug Design",
    "10.1080/07391102.2023.2240413": "Computer-Aided Drug Design",
    "10.1080/07391102.2023.2222839": "Molecular Dynamics & Free Energy",
    "10.3389/fmolb.2024.1348277": "Molecular Dynamics & Free Energy",
    "10.1097/cad.0000000000001492": "Molecular Dynamics & Free Energy",
    "10.3390/molecules28155914": "Computer-Aided Drug Design",
    "10.1016/j.jscs.2023.101728": "Cheminformatics & QSAR",
}

log = lambda *a: print(*a, flush=True)


def http_get(url, timeout=40, headers=None):
    h = dict(UA)
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, headers=h)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def http_json(url, timeout=40):
    return json.loads(http_get(url, timeout=timeout,
                               headers={"Accept": "application/json"}).decode("utf-8-sig"))


def load_state():
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    return {"dois": [], "records": {}, "verification_date": None}


def save_state(state):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=1), encoding="utf-8")


def strip_xml(s):
    return re.sub(r"<[^>]+>", " ", s or "").replace("  ", " ").strip()


def slugify(title, max_len=70):
    s = re.sub(r"<[^>]+>", "", title or "untitled")
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    if len(s) <= max_len:
        return s
    cut = s[:max_len]
    if "-" in cut:
        cut = cut[:cut.rfind("-")]
    return cut.rstrip("-")


# ---------------------------------------------------------------- discover
def discover(state, dry=False):
    """Merge DOIs from ORCID works into the state."""
    url = "https://pub.orcid.org/v3.0/%s/works" % ORCID_ID
    data = http_json(url)
    found = []
    for g in data.get("group", []):
        s = g["work-summary"][0]
        ids = {i["external-id-type"]: i["external-id-value"]
               for i in (s.get("external-ids") or {}).get("external-id", [])}
        doi = (ids.get("doi") or "").lower().strip()
        title = s["title"]["title"]["value"]
        if doi:
            found.append((doi, title))
        else:
            log("  ! work without DOI skipped:", title[:70])
    before = set(state["dois"])
    for doi, title in found:
        if doi not in state["records"]:
            state["records"][doi] = {"doi": doi, "orcid_title": title}
            log("  + new DOI:", doi)
    state["dois"] = sorted({d for d, _ in found} | set(state["dois"]))
    log("discover: %d DOIs total (%d from ORCID)" % (len(state["dois"]), len(found)))
    if not dry:
        save_state(state)


# ---------------------------------------------------------------- verify
def verify(state, dry=False):
    """Enrich every record from Crossref + Unpaywall."""
    today = date.today().isoformat()
    for i, doi in enumerate(state["dois"], 1):
        rec = state["records"].setdefault(doi, {"doi": doi})
        log("verify [%d/%d] %s" % (i, len(state["dois"]), doi))
        try:
            m = http_json("https://api.crossref.org/works/" + urllib.parse.quote(doi))["message"]
            rec["title"] = strip_xml((m.get("title") or [""])[0])
            rec["journal"] = (m.get("container-title") or [""])[0]
            rec["publisher"] = m.get("publisher", "")
            datep = m.get("published-print") or m.get("published-online") or m.get("issued")
            rec["year"] = (datep or {}).get("date-parts", [[None]])[0][0]
            rec["authors"] = [a.get("given", "") + " " + a.get("family", "")
                              for a in m.get("author", [])]
            rec["publisher_url"] = m.get("URL") or ("https://doi.org/" + doi)
            rec["abstract"] = strip_xml(m.get("abstract", "")) or None
            rec["crossref_licenses"] = [l.get("URL", "") for l in m.get("license", [])]
            rec["crossref_ok"] = True
        except Exception as e:
            rec["crossref_ok"] = False
            log("    crossref FAILED:", str(e)[:120])
        time.sleep(1.0)
        try:
            up = http_json("https://api.unpaywall.org/v2/%s?email=%s" % (doi, CONTACT_EMAIL))
            best = up.get("best_oa_location") or {}
            rec["is_oa"] = bool(up.get("is_oa"))
            rec["oa_status"] = up.get("oa_status") or "closed"
            rec["oa_url"] = best.get("url_for_pdf") or best.get("url")
            rec["oa_version"] = best.get("version")
            rec["oa_license"] = (best.get("license") or "").lower() or None
            rec["oa_pages"] = [l.get("url") for l in (up.get("oa_locations") or []) if l.get("url")]
            rec["oa_alt_urls"] = [l.get("url_for_pdf") for l in (up.get("oa_locations") or [])
                                  if l.get("url_for_pdf")]
            rec["unpaywall_ok"] = True
        except Exception as e:
            rec["unpaywall_ok"] = False
            log("    unpaywall FAILED:", str(e)[:120])
        rec["category"] = CATEGORY_BY_DOI.get(doi, "Computer-Aided Drug Design")
        rec.setdefault("researchgate_url", PROFILE_URL)
        rec["verification_date"] = today
        time.sleep(1.0)
    state["verification_date"] = today
    if not dry:
        save_state(state)
    log("verify: done")


# ---------------------------------------------------------------- download
PMC_PDF_RE = re.compile(r'href="([^"]+\.pdf[^"]*)"', re.I)


def _figshare_pdf(url):
    """Return a direct PDF download URL for a figshare article page, if any."""
    m = re.search(r"figshare\.com/[^/]+/([^/?#]+)", url or "")
    if not m:
        return None
    try:
        art = http_json("https://api.figshare.com/v2/articles/" + m.group(1))
        files = art.get("files") or []
        if files:
            return files[0].get("download_url")
    except Exception:
        pass
    return None


def _pmc_pdf(page_url):
    """Resolve a PMC article page to its PDF URL, if present."""
    if not page_url or ("pmc.ncbi.nlm.nih.gov" not in page_url and "/pmc/" not in page_url):
        return None
    try:
        html = http_get(page_url, timeout=45,
                        headers={"Accept": "text/html"}).decode("utf-8", "replace")
        for href in PMC_PDF_RE.findall(html):
            if href.startswith("/"):
                href = "https://pmc.ncbi.nlm.nih.gov" + href
            if ".pdf" in href.lower():
                return href
    except Exception:
        pass
    return None


def _candidate_pdfs(rec):
    """Ordered candidate PDF URLs: repositories first, publisher last."""
    cands = list(rec.get("oa_alt_urls") or [])
    doi = rec["doi"]
    if doi.startswith("10.3389/"):
        fm = re.match(r"10\.3389/(f[a-z]+)\.", doi)
        if fm:
            sub = fm.group(1).replace("fmolb", "molecular-biosciences").replace("fchem", "chemistry")
            cands.append("https://www.frontiersin.org/journals/%s/articles/%s/pdf" % (sub, doi))
    for page in rec.get("oa_pages") or []:
        if "figshare.com" in page:
            fs = _figshare_pdf(page)
            if fs:
                cands.append(fs)
        if "pmc" in page.lower():
            pmc = _pmc_pdf(page)
            if pmc:
                cands.append(pmc)
    if rec.get("oa_url"):
        cands.append(rec["oa_url"])
    seen, out = set(), []
    for c in cands:
        if c and c not in seen:
            seen.add(c)
            out.append(c)
    return out


def download_open_access(state, dry=False):
    """Download only redistributably-licensed PDFs; verify %PDF magic."""
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    licences = {}
    if LICENCES_JSON.exists():
        licences = json.loads(LICENCES_JSON.read_text(encoding="utf-8"))
    for doi, rec in state["records"].items():
        lic = (rec.get("oa_license") or "").lower()
        slug = slugify(rec.get("title") or doi)
        fname = "%s-%s.pdf" % (rec.get("year") or "n-d", slug)
        target = PDF_DIR / fname
        if lic not in REDISTRIBUTABLE or not (rec.get("oa_url") or rec.get("oa_pages")):
            rec["local_pdf"] = None
            rec["download_permission"] = (
                "not attempted: licence '%s' is not redistributable" % (lic or "unknown")
            ) if rec.get("is_oa") else "not open access"
            if target.exists():
                log("  - removing non-redistributable file", fname)
                if not dry:
                    target.unlink()
                licences.pop(fname, None)
            continue
        if target.exists() and target.stat().st_size > 1000 and target.read_bytes()[:4] == b"%PDF":
            rec["local_pdf"] = "/files/publications/" + fname
            rec["download_permission"] = "permitted (%s)" % lic
            continue
        log("  fetching", fname)
        if dry:
            continue
        ok = False
        for url in _candidate_pdfs(rec):
            log("    trying", url[:100])
            try:
                data = http_get(url, timeout=60,
                                headers={"Accept": "application/pdf,*/*"})
            except Exception as e:
                log("      failed:", str(e)[:90])
                time.sleep(1.0)
                continue
            if not data.startswith(b"%PDF"):
                log("      rejected: not a PDF")
                continue
            target.write_bytes(data)
            sha = hashlib.sha256(data).hexdigest()
            rec["local_pdf"] = "/files/publications/" + fname
            rec["download_permission"] = "permitted (%s)" % lic
            rec["pdf_source_url"] = url
            licences[fname] = {
                "doi": doi, "source_url": url, "license": lic,
                "version": rec.get("oa_version"), "sha256": sha,
                "bytes": len(data), "downloaded": date.today().isoformat(),
            }
            log("    OK %d bytes" % len(data))
            ok = True
            break
        if not ok:
            rec["local_pdf"] = None
            rec["download_permission"] = (
                "OA link only: automated download blocked by publisher")
            log("    giving up; keeping official link only")
        if not dry:
            LICENCES_JSON.write_text(json.dumps(licences, ensure_ascii=False, indent=1),
                                     encoding="utf-8")
            save_state(state)
        time.sleep(1.5)
    if not dry:
        LICENCES_JSON.write_text(json.dumps(licences, ensure_ascii=False, indent=1),
                                 encoding="utf-8")
        save_state(state)


# ---------------------------------------------------------------- build
def _yml_escape(s):
    return json.dumps(s if s is not None else "", ensure_ascii=False)


def build(state, dry=False):
    """Write _data/publications.yml, assets/data/publications.json, _publications/*.md."""
    recs = [r for r in state["records"].values() if r.get("title")]
    recs.sort(key=lambda r: (r.get("year") or 0, r.get("title") or ""), reverse=True)

    DATA_YML.parent.mkdir(parents=True, exist_ok=True)
    lines = ["# Generated by scripts/update_publications.py --build", "# %s — %d records"
             % (date.today().isoformat(), len(recs)), "publications:"]
    for r in recs:
        lines.append("  - doi: %s" % _yml_escape(r["doi"]))
        lines.append("    title: %s" % _yml_escape(r["title"]))
        lines.append("    year: %s" % (r.get("year") or "null"))
        lines.append("    journal: %s" % _yml_escape(r.get("journal") or ""))
        lines.append("    publisher: %s" % _yml_escape(r.get("publisher") or ""))
        lines.append("    category: %s" % _yml_escape(r.get("category") or ""))
        lines.append("    authors:")
        for a in r.get("authors") or []:
            lines.append("      - %s" % _yml_escape(a))
        lines.append("    is_oa: %s" % ("true" if r.get("is_oa") else "false"))
        lines.append("    oa_status: %s" % _yml_escape(r.get("oa_status") or "closed"))
        lines.append("    oa_license: %s" % _yml_escape(r.get("oa_license")))
        lines.append("    local_pdf: %s" % _yml_escape(r.get("local_pdf")))
        lines.append("    publisher_url: %s" % _yml_escape(r.get("publisher_url") or ("https://doi.org/" + r["doi"])))
        lines.append("    researchgate_url: %s" % _yml_escape(PROFILE_URL))
        lines.append("    abstract: %s" % _yml_escape((r.get("abstract") or "")[:1500] or None))
        lines.append("    verification_date: %s" % _yml_escape(r.get("verification_date") or ""))
    DATA_YML.write_text("\n".join(lines) + "\n", encoding="utf-8")

    pub_list = []
    for r in recs:
        pub_list.append({
            "title": r["title"],
            "authors": r.get("authors") or [],
            "year": r.get("year"),
            "journal": r.get("journal") or "",
            "doi": r["doi"],
            "category": r.get("category") or "",
            "is_oa": bool(r.get("is_oa")),
            "oa_license": r.get("oa_license"),
            "pdf": r.get("local_pdf"),
            "url": r.get("publisher_url") or ("https://doi.org/" + r["doi"]),
            "researchgate": PROFILE_URL,
            "abstract": r.get("abstract"),
        })
    DATA_JSON.parent.mkdir(parents=True, exist_ok=True)
    DATA_JSON.write_text(json.dumps({
        "generated": date.today().isoformat(),
        "count": len(pub_list),
        "profile": PROFILE_URL,
        "publications": pub_list,
    }, ensure_ascii=False, indent=1), encoding="utf-8")

    if not dry:
        for old in PUB_DIR.glob("*.md"):
            old.unlink()
    for r in recs:
        slug = slugify(r["title"], 60)
        fname = "%s-%s.md" % (r.get("year") or 0, slug)
        authors = ", ".join(r.get("authors") or ["Abdelmoujoud Faris"])
        citation = '%s (%s). "%s." <i>%s</i>.' % (authors, r.get("year") or "n.d.",
                                                  r["title"], r.get("journal") or "")
        md = [
            "---",
            "title: %s" % _yml_escape(r["title"]),
            "collection: publications",
            "layout: inner",
            "eyebrow: Peer-reviewed article",
            "category: manuscripts",
            "permalink: /publication/%s-%s" % (r.get("year") or 0, slug),
            "excerpt: %s" % _yml_escape((r.get("abstract") or "")[:300]),
            "date: %s-01-01" % (r.get("year") or 1900),
            "venue: %s" % _yml_escape(r.get("journal") or ""),
            "paperurl: %s" % _yml_escape(r.get("publisher_url") or ("https://doi.org/" + r["doi"])),
            "doi: %s" % _yml_escape(r["doi"]),
            "authors: %s" % _yml_escape(authors),
            "is_oa: %s" % ("true" if r.get("is_oa") else "false"),
            "local_pdf: %s" % _yml_escape(r.get("local_pdf")),
            "citation: %s" % _yml_escape(citation),
            "---",
            "",
            "%s" % citation,
            "",
            "**Journal:** <i>%s</i> · %s" % (r.get("journal") or "", r.get("year") or ""),
            "",
            "**DOI:** [%s](https://doi.org/%s)" % (r["doi"], r["doi"]),
            "",
        ]
        if r.get("local_pdf"):
            md.append("**Open-access PDF (%s):** [download](%s)" % (
                r.get("oa_license") or "OA", r["local_pdf"]))
            md.append("")
        if r.get("abstract"):
            md.append("## Abstract")
            md.append("")
            md.append(r["abstract"])
            md.append("")
        md.append("Metadata verified against Crossref and Unpaywall on %s."
                  % (r.get("verification_date") or date.today().isoformat()))
        md.append("")
        (PUB_DIR / fname).write_text("\n".join(md), encoding="utf-8")
    log("build: %d publications written" % len(recs))


# ---------------------------------------------------------------- check
def check(state):
    ok = True
    recs = state["records"]
    dois = state["dois"]
    if len(recs) != len(dois):
        log("FAIL: records (%d) != dois (%d)" % (len(recs), len(dois)))
        ok = False
    seen_titles = {}
    for doi, r in recs.items():
        if not r.get("title"):
            log("FAIL: missing title for", doi); ok = False
        if not re.match(r"^10\.\d{4,9}/\S+$", doi):
            log("FAIL: malformed DOI", doi); ok = False
        t = (r.get("title") or "").lower()
        if t in seen_titles and seen_titles[t] != doi:
            log("FAIL: duplicate title across DOIs", doi, seen_titles[t]); ok = False
        seen_titles[t] = doi
    for f in PDF_DIR.glob("*.pdf"):
        head = f.read_bytes()[:4]
        if head != b"%PDF":
            log("FAIL: corrupt PDF", f.name); ok = False
        if f.stat().st_size < 2000:
            log("WARN: suspiciously small PDF", f.name)
    n_md = len(list(PUB_DIR.glob("*.md")))
    n_yml = DATA_YML.read_text(encoding="utf-8").count("- doi:") if DATA_YML.exists() else 0
    n_json = json.loads(DATA_JSON.read_text(encoding="utf-8"))["count"] if DATA_JSON.exists() else 0
    if not (n_md == n_yml == n_json == len(dois)):
        log("FAIL: count mismatch md=%d yml=%d json=%d dois=%d" % (n_md, n_yml, n_json, len(dois)))
        ok = False
    licences = json.loads(LICENCES_JSON.read_text(encoding="utf-8")) if LICENCES_JSON.exists() else {}
    for fname, meta in licences.items():
        if not (PDF_DIR / fname).exists():
            log("FAIL: licence record without file", fname); ok = False
        if meta.get("license") not in REDISTRIBUTABLE:
            log("FAIL: non-redistributable licence hosted", fname); ok = False
    n_oa = sum(1 for r in recs.values() if r.get("is_oa"))
    n_pdf = sum(1 for r in recs.values() if r.get("local_pdf"))
    log("check: %d publications | %d with DOI | %d OA | %d hosted PDFs | %d metadata-only"
        % (len(recs), sum(1 for r in recs.values() if r.get("doi")), n_oa, n_pdf, len(recs) - n_pdf))
    log("check:", "PASS" if ok else "FAIL")
    return ok


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--discover", action="store_true")
    p.add_argument("--verify", action="store_true")
    p.add_argument("--download-open-access", action="store_true")
    p.add_argument("--build", action="store_true")
    p.add_argument("--check", action="store_true")
    p.add_argument("--all", action="store_true")
    p.add_argument("--dry-run", action="store_true")
    a = p.parse_args()
    if not any([a.discover, a.verify, a.download_open_access, a.build, a.check, a.all]):
        p.print_help(); return 0
    state = load_state()
    ok = True
    if a.discover or a.all:
        discover(state, dry=a.dry_run)
    if a.verify or a.all:
        verify(state, dry=a.dry_run)
    if a.download_open_access or a.all:
        download_open_access(state, dry=a.dry_run)
    if a.build or a.all:
        build(state, dry=a.dry_run)
    if a.check or a.all:
        state = load_state()
        ok = check(state)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
