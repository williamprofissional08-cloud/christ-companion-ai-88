#!/usr/bin/env python3
"""Integrity checks for the original 2 Timothy 3 study; no data mutation."""
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
study = (ROOT / "src/lib/content/2-timothy-3-study.ts").read_text(encoding="utf-8")
catalog = (ROOT / "src/lib/content/curated-studies.ts").read_text(encoding="utf-8")
assert "Paráfrase livre original" in study
assert len(re.findall(r'"id": "exposicao-versiculo-\d+"', study)) == 17
ids = re.findall(r'"id": "([^"]+)"', study)
assert len(ids) == len(set(ids)) and len(ids) >= 30
for number in range(1, 18):
    assert f'2 Timóteo 3:{number}' in study
    assert f'**{number}.**' in study
for key in ("leitura-integral", "contexto", "pericope-1", "pericope-2", "pericope-3", "referencias", "perguntas", "oficina", "oracao"):
    assert f'"id": "{key}"' in study
assert catalog.count('import { secondTimothy3Study } from "./2-timothy-3-study";') == 1
assert catalog.count('"biblia-2-timoteo-cap-3": secondTimothy3Study') == 1
print("2 Timóteo 3: integridade estrutural e catálogo OK; revisão humana ainda necessária")
