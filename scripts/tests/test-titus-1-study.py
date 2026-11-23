#!/usr/bin/env python3
"""Read-only structural checks for the Titus 1 study."""
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[2]
study = (ROOT / "src/lib/content/titus-1-study.ts").read_text(encoding="utf-8")
catalog = (ROOT / "src/lib/content/curated-studies.ts").read_text(encoding="utf-8")
assert 'Paráfrase livre original' in study
assert 'não é tradução bíblica oficial' in study
for verse in range(1, 17):
    assert f'**{verse}.**' in study, f'leitura ausente: {verse}'
    assert f'"id": "exposicao-versiculo-{verse}"' in study, f'exposição ausente: {verse}'
ids = re.findall(r'"id": "([^"]+)"', study)
assert len(ids) == len(set(ids)), "IDs repetidos"
for marker in ('pericope-a', 'pericope-b', 'pericope-c', 'interpretacao', 'cuidados', 'referencias', 'aplicacao', 'perguntas', 'pregador', 'oracao'):
    assert f'"id": "{marker}"' in study, marker
assert catalog.count('"biblia-tito-cap-1": titus1Study') == 1
assert catalog.count('import { titus1Study } from "./titus-1-study";') == 1
print("Tito 1: leitura 16/16, exposições 16/16, IDs únicos, seções e catálogo OK")
