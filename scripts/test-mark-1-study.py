#!/usr/bin/env python3
"""Integridade de Marcos 1; verificação estrutural, não revisão humana."""
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
STUDY = ROOT / "src/lib/content/mark-1-study.ts"
CATALOG = ROOT / "src/lib/content/curated-studies.ts"
BIBLE = ROOT / "src/lib/bible-livre/marcos.json"

class MarkOneIntegrity(unittest.TestCase):
    def test_verse_coverage_and_unique_sections(self):
        source = STUDY.read_text(encoding="utf-8")
        bible = json.loads(BIBLE.read_text(encoding="utf-8"))
        expected = len(bible["chapters"]["1"])
        self.assertEqual(expected, 45)
        ids = re.findall(r'"id": "(versiculo-\d+)"', source)
        self.assertEqual(ids, [f"versiculo-{n}" for n in range(1, expected + 1)])
        all_ids = re.findall(r'"id": "([^"]+)"', source)
        self.assertEqual(len(all_ids), len(set(all_ids)))
        for n in range(1, expected + 1):
            self.assertIn(f'"Marcos 1:{n}"', source)
        self.assertIn("paráfrases explicativas livres e originais", source)
        for term in ("Oficina do pregador", "Exercícios com respostas", "Oração final", "Referências cruzadas"):
            self.assertIn(term, source)
    def test_catalog_single_registration(self):
        source = CATALOG.read_text(encoding="utf-8")
        self.assertEqual(source.count('import { mark1Study } from "./mark-1-study";'), 1)
        self.assertEqual(source.count('"biblia-marcos-cap-1": mark1Study,'), 1)

if __name__ == "__main__":
    unittest.main()
