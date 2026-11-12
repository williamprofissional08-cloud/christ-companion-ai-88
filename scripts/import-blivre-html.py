#!/usr/bin/env python3
"""Convert the official eBible.org BLIVRE HTML archive into chapter-addressable JSON.

Source archive: https://ebible.org/Scriptures/porbr2018_html.zip
Translation and license details: https://ebible.org/porbr2018/copyright.htm
Run: python3 scripts/import-blivre-html.py /path/to/porbr2018_html.zip
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from html.parser import HTMLParser
from pathlib import Path

# eBible USFM book code -> application catalog slug and chapter count.
BOOKS: dict[str, tuple[str, int]] = {
    "GEN": ("genesis", 50), "EXO": ("exodo", 40), "LEV": ("levitico", 27),
    "NUM": ("numeros", 36), "DEU": ("deuteronomio", 34), "JOS": ("josue", 24),
    "JDG": ("juizes", 21), "RUT": ("rute", 4), "1SA": ("1-samuel", 31),
    "2SA": ("2-samuel", 24), "1KI": ("1-reis", 22), "2KI": ("2-reis", 25),
    "1CH": ("1-cronicas", 29), "2CH": ("2-cronicas", 36), "EZR": ("esdras", 10),
    "NEH": ("neemias", 13), "EST": ("ester", 10), "JOB": ("jo", 42),
    "PSA": ("salmos", 150), "PRO": ("proverbios", 31), "ECC": ("eclesiastes", 12),
    "SNG": ("cantares", 8), "ISA": ("isaias", 66), "JER": ("jeremias", 52),
    "LAM": ("lamentacoes", 5), "EZK": ("ezequiel", 48), "DAN": ("daniel", 12),
    "HOS": ("oseias", 14), "JOL": ("joel", 3), "AMO": ("amos", 9),
    "OBA": ("obadias", 1), "JON": ("jonas", 4), "MIC": ("miqueias", 7),
    "NAM": ("naum", 3), "HAB": ("habacuque", 3), "ZEP": ("sofonias", 3),
    "HAG": ("ageu", 2), "ZEC": ("zacarias", 14), "MAL": ("malaquias", 4),
    "MAT": ("mateus", 28), "MRK": ("marcos", 16), "LUK": ("lucas", 24),
    "JHN": ("joao", 21), "ACT": ("atos", 28), "ROM": ("romanos", 16),
    "1CO": ("1-corintios", 16), "2CO": ("2-corintios", 13), "GAL": ("galatas", 6),
    "EPH": ("efesios", 6), "PHP": ("filipenses", 4), "COL": ("colossenses", 4),
    "1TH": ("1-tessalonicenses", 5), "2TH": ("2-tessalonicenses", 3),
    "1TI": ("1-timoteo", 6), "2TI": ("2-timoteo", 4), "TIT": ("tito", 3),
    "PHM": ("filemom", 1), "HEB": ("hebreus", 13), "JAS": ("tiago", 5),
    "1PE": ("1-pedro", 5), "2PE": ("2-pedro", 3), "1JN": ("1-joao", 5),
    "2JN": ("2-joao", 1), "3JN": ("3-joao", 1), "JUD": ("judas", 1),
    "REV": ("apocalipse", 22),
}

VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
SKIP_CLASSES = {"notemark", "footnote"}


class VerseParser(HTMLParser):
    """Collect only verse text, omitting verse labels and footnote markers."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.verses: dict[int, str] = {}
        self.current_number: int | None = None
        self.current_parts: list[str] = []
        self.in_verse_marker = False
        self.skip_tag: str | None = None
        self.skip_depth = 0

    def _flush(self) -> None:
        if self.current_number is None:
            return
        text = re.sub(r"\s+", " ", "".join(self.current_parts)).strip()
        if text:
            self.verses[self.current_number] = text
        self.current_number = None
        self.current_parts = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = dict(attrs)
        classes = set((attr.get("class") or "").split())

        if self.skip_tag is not None:
            if tag not in VOID_TAGS:
                self.skip_depth += 1
            return

        if "verse" in classes:
            self._flush()
            match = re.fullmatch(r"V(\d+)", attr.get("id") or "")
            if match:
                self.current_number = int(match.group(1))
                self.in_verse_marker = True
            return

        if self.current_number is not None and classes & SKIP_CLASSES:
            if tag == "div" and "footnote" in classes:
                self._flush()
            self.skip_tag = tag
            self.skip_depth = 1 if tag not in VOID_TAGS else 0
            if self.skip_depth == 0:
                self.skip_tag = None
            return

    def handle_endtag(self, tag: str) -> None:
        if self.skip_tag is not None:
            if tag not in VOID_TAGS:
                self.skip_depth -= 1
            if self.skip_depth <= 0:
                self.skip_tag = None
                self.skip_depth = 0
            return
        if self.in_verse_marker and tag == "span":
            self.in_verse_marker = False

    def handle_data(self, data: str) -> None:
        if self.current_number is not None and not self.in_verse_marker and self.skip_tag is None:
            self.current_parts.append(data)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def finish(self) -> dict[int, str]:
        self._flush()
        return self.verses


def convert(archive: Path, output_dir: Path) -> tuple[int, int, int]:
    books: dict[str, dict[int, list[str]]] = {slug: {} for slug, _ in BOOKS.values()}
    chapter_pattern = re.compile(r"([A-Z0-9]{3})(\d{2,3})\.htm$", re.IGNORECASE)

    with zipfile.ZipFile(archive) as zipped:
        for name in zipped.namelist():
            filename = name.rsplit("/", 1)[-1]
            match = chapter_pattern.fullmatch(filename)
            if not match:
                continue
            code = match.group(1).upper()
            chapter = int(match.group(2))
            if code not in BOOKS or chapter == 0:
                continue

            parser = VerseParser()
            parser.feed(zipped.read(name).decode("utf-8", errors="replace"))
            verses = parser.finish()
            if not verses:
                raise ValueError(f"No verse text found in {filename}")
            expected_numbers = list(range(1, max(verses) + 1))
            if sorted(verses) != expected_numbers:
                raise ValueError(f"Non-contiguous verses in {filename}: {sorted(verses)[:8]}…")

            slug, max_chapters = BOOKS[code]
            if chapter > max_chapters:
                raise ValueError(f"Unexpected chapter {chapter} for {code} in {filename}")
            books[slug][chapter] = [verses[number] for number in expected_numbers]

    expected_chapters_total = 0
    for code, (slug, chapter_count) in BOOKS.items():
        expected_chapters_total += chapter_count
        actual = sorted(books[slug])
        expected = list(range(1, chapter_count + 1))
        if actual != expected:
            missing = sorted(set(expected) - set(actual))
            extra = sorted(set(actual) - set(expected))
            raise ValueError(f"Chapter coverage mismatch for {code}: missing={missing}, extra={extra}")

    if len(books) != 66:
        raise ValueError(f"Expected 66 books, found {len(books)}")

    output_dir.mkdir(parents=True, exist_ok=True)
    verse_total = 0
    for code, (slug, _) in BOOKS.items():
        chapters = books[slug]
        verse_total += sum(len(verses) for verses in chapters.values())
        output = {
            "translation": "BLIVRE",
            "sourceBookCode": code,
            "chapters": {str(number): verses for number, verses in sorted(chapters.items())},
        }
        (output_dir / f"{slug}.json").write_text(
            json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n",
            encoding="utf-8",
        )

    return len(books), expected_chapters_total, verse_total


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path, help="Official porbr2018_html.zip archive")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("src/lib/bible-livre"),
        help="Directory where per-book JSON files will be written",
    )
    args = parser.parse_args()
    if not args.archive.is_file():
        parser.error(f"Archive not found: {args.archive}")
    try:
        books, chapters, verses = convert(args.archive, args.output)
    except (OSError, ValueError, zipfile.BadZipFile) as error:
        print(f"BLIVRE import failed: {error}", file=sys.stderr)
        return 1
    print(f"Imported {books} books, {chapters} chapters, and {verses} verses to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
