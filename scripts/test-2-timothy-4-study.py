#!/usr/bin/env python3
"""Integrity test for the curated study of 2 Timothy 4 (read-only)."""
import pathlib
import re
import json
ROOT = pathlib.Path(__file__).resolve().parents[1]
study = (ROOT / "src/lib/content/2-timothy-4-study.ts").read_text(encoding="utf-8")
catalog = (ROOT / "src/lib/content/curated-studies.ts").read_text(encoding="utf-8")
source = json.loads((ROOT / "src/lib/bible-livre/2-timoteo.json").read_text(encoding="utf-8"))
assert len(source["chapters"]["4"]) == 22
ids = re.findall(r'"id":\s*"([^"]+)"', study)
assert len(ids) >= 35 and len(ids) == len(set(ids))
for verse in range(1,23):
    assert study.count(f'**{verse}.**') == 1, f"Paráfrase ausente: {verse}"
    assert f'exposicao-versiculo-{verse}' in ids, f"Exposição ausente: {verse}"
assert study.count('Paráfrase livre original') >= 1
assert catalog.count('biblia-2-timoteo-cap-4') == 1
assert catalog.count('import { secondTimothy4Study }') == 1
print("2 Timóteo 4: 22/22 versículos, IDs únicos e catálogo único")
