#!/usr/bin/env python3
"""Read-only structural integrity check for 2 Timothy 2."""
import json
import pathlib
import re
ROOT = pathlib.Path(__file__).resolve().parents[1]
source = (ROOT / "src/lib/content/2-timothy-2-study.ts").read_text(encoding="utf-8")
catalog = (ROOT / "src/lib/content/curated-studies.ts").read_text(encoding="utf-8")
bible = json.loads((ROOT / "src/lib/bible-livre/2-timoteo.json").read_text(encoding="utf-8"))
assert len(bible["chapters"]["2"]) == 26
assert "Paráfrase livre original" in source
assert "não tradução bíblica oficial" in source
assert len(re.findall(r'"id": "exposicao-versiculo-\\d+"', source)) == 26
ids = re.findall(r'"id": "([^"]+)"', source)
assert len(ids) == len(set(ids)), "Duplicate section IDs"
for n in range(1, 27):
    assert f'"id": "exposicao-versiculo-{n}"' in source
    assert f'**{n}.**' in source
for marker in ("leitura-integral","contexto","pericope-1","pericope-2","pericope-3","pericope-4","interpretacoes","referencias","perguntas","oficina","oracao"):
    assert f'"id": "{marker}"' in source
assert catalog.count('import { secondTimothy2Study } from "./2-timothy-2-study";') == 1
assert len(re.findall(r'"biblia-2-timoteo-cap-2"\\s*:\\s*secondTimothy2Study',catalog)) == 1
print("2 Timóteo 2: 26/26 versículos, IDs únicos, catálogo único")
