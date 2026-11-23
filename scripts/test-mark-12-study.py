#!/usr/bin/env python3
"""Integridade do estudo Marcos 12; sem alterações de dados."""
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
STUDY = ROOT / "src/lib/content/mark-12-study.ts"
CATALOG = ROOT / "src/lib/content/curated-studies.ts"
BLIVRE = ROOT / "src/lib/bible-livre/marcos.json"

class Mark12Integrity(unittest.TestCase):
    def test_all_verses_and_unique_ids(self):
        text = STUDY.read_text(encoding="utf-8")
        count = len(json.loads(BLIVRE.read_text(encoding="utf-8"))["chapters"]["12"])
        self.assertEqual(count, 44)
        verse_ids = re.findall(r'"id": "versiculo-(\d+)"', text)
        self.assertEqual(verse_ids, [str(n) for n in range(1, count + 1)])
        ids = re.findall(r'"id": "([^"]+)"', text)
        self.assertEqual(len(ids), len(set(ids)))
        self.assertIn("Paráfrase explicativa livre original", text)
        for required in ("oficina-pregador", "oracao-final", "exercicios", "questoes", "pericope-7"):
            self.assertIn(f'"id": "{required}"', text)

    def test_catalog_single_registration(self):
        text = CATALOG.read_text(encoding="utf-8")
        self.assertEqual(text.count('import { mark12Study } from "./mark-12-study";'), 1)
        self.assertEqual(len(re.findall(r'"biblia-marcos-cap-12"\s*:\s*mark12Study', text)), 1)

if __name__ == "__main__":
    unittest.main()
