#!/usr/bin/env python3
"""Verificação estática de integridade do estudo Hebreus 2, sem dependências extras."""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
source = (ROOT / "src/lib/content/hebrews-2-study.ts").read_text(encoding="utf-8")
catalog = (ROOT / "src/lib/content/curated-studies.ts").read_text(encoding="utf-8")
assert "paráfrase livre original" in source.lower()
assert "Hebreus 2:1–18" in source
for verse in range(1, 19):
    assert len(re.findall(r'"id": "exposicao-versiculo-' + str(verse) + r'"', source)) == 1, verse
    assert f"Hebreus 2:{verse}" in source, verse
ids = re.findall(r'"id": "([^"]+)"', source)
assert len(ids) == len(set(ids)), "IDs duplicados"
for key in ("leitura-integral","contexto-e-objetivos","estrutura-pericopes","referencias-cruzadas","interpretacao-e-inferencia","cuidados-pastorais","aplicacao","perguntas-respostas","oficina-pregador","oracao"):
    assert key in ids, key
assert catalog.count('import { hebrews2Study } from "./hebrews-2-study";') == 1
assert catalog.count('"biblia-hebreus-cap-2": hebrews2Study') == 1
print("Hebreus 2: integridade estrutural aprovada (18/18).")
