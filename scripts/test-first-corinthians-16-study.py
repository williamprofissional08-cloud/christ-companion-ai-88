#!/usr/bin/env python3
"""Read-only structural integrity test for 1 Corinthians 16."""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
study = (ROOT / "src/lib/content/first-corinthians-16-study.ts").read_text(encoding="utf-8")
catalog = (ROOT / "src/lib/content/curated-studies.ts").read_text(encoding="utf-8")
source = json.loads((ROOT / "src/lib/bible-livre/1-corintios.json").read_text(encoding="utf-8"))
assert len(source["chapters"]["16"]) == 24
assert study.count('"id": "versiculo-') == 24
assert [int(x) for x in re.findall(r'"id": "versiculo-(\\d+)"', study)] == list(range(1, 25))
ids = re.findall(r'"id": "([^"]+)"', study)
assert len(ids) == len(set(ids))
assert study.count("**Paráfrase livre original:**") == 24
assert study.count("**Exposição contextual:**") == 24
assert catalog.count('import { firstCorinthians16Study } from "./first-corinthians-16-study";') == 1
assert catalog.count('"biblia-1-corintios-cap-16": firstCorinthians16Study') == 1
print("OK: 1 Corinthians 16 — 24 verses, unique IDs, catalog registration")
