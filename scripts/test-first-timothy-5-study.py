#!/usr/bin/env python3
"""Structural integrity for 1 Timothy 5; human editorial review remains required."""
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
study = (ROOT / "src/lib/content/1-timothy-5-study.ts").read_text(encoding="utf-8")
catalog = (ROOT / "src/lib/content/curated-studies.ts").read_text(encoding="utf-8")
assert "Paráfrase livre original" in study
assert len(re.findall(r'"id": "versiculo-\d+"', study)) == 25
ids = re.findall(r'"id": "([^"]+)"', study)
assert len(ids) == len(set(ids)) and len(ids) >= 35
for n in range(1, 26):
    assert f'1 Timóteo 5:{n}' in study
    assert f'**{n}.**' in study
for key in ("leitura-integral", "contexto", "pericope-1", "pericope-5", "referencias", "perguntas", "oficina", "oracao"):
    assert f'"id": "{key}"' in study
assert catalog.count('import { firstTimothy5Study } from "./1-timothy-5-study";') == 1
assert catalog.count('"biblia-1-timoteo-cap-5": firstTimothy5Study') == 1
print("1 Timóteo 5: integridade estrutural OK; revisão humana pendente")
