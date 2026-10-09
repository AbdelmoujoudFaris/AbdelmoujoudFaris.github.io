"""Save GitHub's own contribution calendar as assets/data/contrib.json (run daily by a GitHub Action)."""
import json
import re
import sys
import urllib.request
from pathlib import Path

USER = "AbdelmoujoudFaris"
html = urllib.request.urlopen(f"https://github.com/users/{USER}/contributions", timeout=30).read().decode("utf-8")

total = int(re.search(r"([\d,]+)\s+contributions?\s+in the last year", html).group(1).replace(",", ""))
tips = {m.group(1): m.group(2) for m in re.finditer(r'<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)</tool-tip>', html)}
days = []
for m in re.finditer(r'<td[^>]*data-date="([\d-]+)"[^>]*>', html):
    td = m.group(0)
    cid = re.search(r'id="([^"]+)"', td)
    level = re.search(r'data-level="(\d)"', td)
    tip = tips.get(cid.group(1), "") if cid else ""
    n = re.match(r"(\d+)", tip)
    days.append({"date": m.group(1), "level": int(level.group(1)) if level else 0, "count": int(n.group(1)) if n else 0})
days.sort(key=lambda d: d["date"])
if not days:
    sys.exit("no contribution days found")
out = Path(__file__).resolve().parent.parent / "assets" / "data" / "contrib.json"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps({"total": total, "contributions": days}, separators=(",", ":")))
print(f"{total} contributions, {len(days)} days -> {out}")
