#!/usr/bin/env python3
"""Verificação estática de integridade do estudo de Mateus 19 (sem APIs)."""
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
STUDY = ROOT / "src/lib/content/matthew-19-study.ts"
CATALOG = ROOT / "src/lib/content/curated-studies.ts"
BIBLE = ROOT / "src/lib/bible-livre/mateus.json"

class Matthew19StudyTest(unittest.TestCase):
    def test_chapter_source_has_thirty_verses(self):
        chapter = json.loads(BIBLE.read_text(encoding="utf-8"))["chapters"]["19"]
        self.assertEqual(len(chapter), 30)
        self.assertTrue(all(isinstance(v, str) and v.strip() for v in chapter))

    def test_all_verse_sections_unique_and_in_order(self):
        source = STUDY.read_text(encoding="utf-8")
        ids = [int(n) for n in re.findall(r'"id": "versiculo-(\\d+)"', source)]
        self.assertEqual(ids, list(range(1, 31)))
        refs = [int(n) for n in re.findall(r'"Mateus 19:(\\d+)"', source)]
        self.assertEqual(refs, list(range(1, 31)))
        self.assertIn("Paráfrase explicativa livre", source)
        for section in ("leitura", "contexto", "estrutura", "termos", "debates", "referencias", "cristo", "distincoes", "exercicios", "pregador", "oracao"):
            self.assertIn('"id": "' + section + '"', source)

    def test_catalog_registration_is_unique(self):
        catalog = CATALOG.read_text(encoding="utf-8")
        self.assertEqual(catalog.count('"biblia-mateus-cap-19": matthew19Study'), 1)
        self.assertEqual(catalog.count('import { matthew19Study } from "./matthew-19-study";'), 1)

if __name__ == "__main__":
    unittest.main()
