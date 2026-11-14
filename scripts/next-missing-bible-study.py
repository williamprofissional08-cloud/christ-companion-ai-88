#!/usr/bin/env python3
"""Pick the next genuinely missing curated study in canonical order.

This is a read-only scheduler. It does not call AI APIs, spend credits, or
modify study data. Missing files and missing catalog registration both count.
"""
import argparse
import importlib.util
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("study_audit", ROOT / "scripts" / "audit-bible-studies.py")
if not spec or not spec.loader:
    raise SystemExit("Não foi possível carregar a auditoria de estudos.")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

def next_missing():
    audit = module.audit()
    for book in audit["books"]:
        if book["missing"]:
            chapter = book["missing"][0]
            return {
                "finished": False,
                "book_slug": book["slug"],
                "book_name": book["name"],
                "chapter": chapter,
                "integrated": audit["summary"]["studies_integrated"],
                "missing": audit["summary"]["missing"],
                "editorial_review": audit["summary"]["chapters_flagged_for_editorial_review"],
            }
    return {
        "finished": True,
        "book_slug": "",
        "book_name": "",
        "chapter": 0,
        "integrated": audit["summary"]["studies_integrated"],
        "missing": audit["summary"]["missing"],
        "editorial_review": audit["summary"]["chapters_flagged_for_editorial_review"],
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--github-output", action="store_true")
    args = parser.parse_args()
    result = next_missing()
    print(json.dumps(result, ensure_ascii=False))
    if args.github_output:
        path = os.environ.get("GITHUB_OUTPUT")
        if not path:
            raise SystemExit("GITHUB_OUTPUT ausente.")
        with open(path, "a", encoding="utf-8") as output:
            for key in ("finished", "book_slug", "chapter", "integrated", "missing"):
                val = str(result[key]).lower() if isinstance(result[key], bool) else str(result[key])
                output.write(f"{key}={val}\n")

if __name__ == "__main__":
    main()
