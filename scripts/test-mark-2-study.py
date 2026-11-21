#!/usr/bin/env python3
"""Integridade de Marcos 2; não substitui revisão humana."""
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
STUDY = ROOT / "src/lib/content/mark-2-study.ts"
CATALOG = ROOT / "src/lib/content/curated-studies.ts"
BIBLE = ROOT / "src/lib/bible-livre/marcos.json"

class MarkTwoIntegrity(unittest.TestCase):
    def test_verse_coverage_and_unique_sections(self):
        source = STUDY.read_text(encoding="utf-8")
        bible = json.loads(BIBLE.read_text(encoding="utf-8"))
        expected = len(bible["chapters"]["2"])
        self.assertEqual(expected, 28)
        ids = re.findall(r'"id": "(versiculo-\d+)"', source)
        self.assertEqual(ids, [f"versiculo-{n}" for n in range(1, expected + 1)])
        all_ids = re.findall(r'"id": "([^"]+)"', source)
        self.assertEqual(len(all_ids), len(set(all_ids)))
        for n in range(1, expected + 1):
            self.assertIn(f'"Marcos 2:{n}"', source)
        self.assertIn("paráfrases explicativas livres e originais", source)
        for term in ("Oficina do pregador", "Exercícios com respostas", "Oração final", "Referências cruzadas"):
            self.assertIn(term, source)

    def test_catalog_single_registration(self):
        source = CATALOG.read_text(encoding="utf-8")
        self.assertEqual(source.count('import { mark2Study } from "./mark-2-study";'), 1)
        self.assertEqual(source.count('"biblia-marcos-cap-2": mark2Study,'), 1)

if __name__ == "__main__":
    unittest.main()
