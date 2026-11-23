#!/usr/bin/env python3
"""Integridade estrutural de Hebreus 1; não substitui revisão editorial humana."""
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
STUDY = ROOT / "src/lib/content/hebrews-1-study.ts"
CATALOG = ROOT / "src/lib/content/curated-studies.ts"
BIBLE = ROOT / "src/lib/bible-livre/hebreus.json"

class HebrewsOneIntegrity(unittest.TestCase):
    def test_verses_and_catalog(self):
        source = STUDY.read_text(encoding="utf-8")
        payload = source.split("= ", 1)[1].rsplit(";", 1)[0]
        study = json.loads(payload)
        bible = json.loads(BIBLE.read_text(encoding="utf-8"))
        count = len(bible["chapters"]["1"])
        self.assertEqual(count, 14)
        sections = study["sections"]
        ids = [section["id"] for section in sections]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertGreaterEqual(len(sections), 18)
        reading = next(section for section in sections if section["id"] == "leitura-integral")
        self.assertIn("paráfrase livre", reading["body"].lower())
        numbers = [int(n) for n in re.findall(r"\*\*(\d+)\.\*\*", reading["body"])]
        self.assertEqual(numbers, list(range(1, count + 1)))
        exposition = [section for section in sections if section["id"].startswith("exposicao-versiculo-")]
        self.assertEqual(len(exposition), count)
        self.assertTrue(all(section["body"].strip() for section in sections))
        catalog = CATALOG.read_text(encoding="utf-8")
        self.assertEqual(catalog.count('import { hebrews1Study } from "./hebrews-1-study";'), 1)
        self.assertEqual(len(re.findall(r'"biblia-hebreus-cap-1"\s*:\s*hebrews1Study', catalog)), 1)

if __name__ == "__main__":
    unittest.main()
