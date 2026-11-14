#!/usr/bin/env python3
"""Audit the 66-book study catalog without modifying existing studies or user data."""
import argparse
import collections
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
CONTENT = ROOT / "src/lib/content"
BOOKS = CONTENT / "bible-books.ts"
CATALOG = CONTENT / "curated-studies.ts"
GENERATOR = ROOT / "scripts/generate-bible-study-batch.py"

def parse_books():
    source = BOOKS.read_text(encoding="utf-8")
    books = []
    for match in re.finditer(r"\{([^{}]*\bslug\s*:[^{}]*)\}", source, re.S):
        item = match.group(1)
        fields = {}
        for key in ("slug", "name"):
            found = re.search(r'\b' + key + r'\s*:\s*"([^"]+)"', item)
            if found:
                fields[key] = found.group(1)
        chapters = re.search(r"\bchapters\s*:\s*(\d+)", item)
        if "slug" in fields and "name" in fields and chapters:
            books.append({**fields, "chapters": int(chapters.group(1))})
    return books

def parse_prefixes():
    source = GENERATOR.read_text(encoding="utf-8")
    start = source.find("PREFIX = {")
    end = source.find("\n}", start)
    if start < 0 or end < 0:
        raise ValueError("Tabela PREFIX não encontrada no gerador")
    return dict(re.findall(r'"([^"]+)":\s*"([^"]+)"', source[start:end]))

def slug_for(book, chapter):
    if book == "genesis" and chapter == 1:
        return "genesis-1-criacao"
    return "biblia-" + book + "-cap-" + str(chapter)

def ranges(numbers):
    if not numbers:
        return "—"
    groups = []
    start = prev = numbers[0]
    for number in numbers[1:]:
        if number == prev + 1:
            prev = number
            continue
        groups.append(str(start) if start == prev else str(start) + "–" + str(prev))
        start = prev = number
    groups.append(str(start) if start == prev else str(start) + "–" + str(prev))
    return ", ".join(groups)

def audit_study(path):
    source = path.read_text(encoding="utf-8")
    section_match = re.search(r'(?:["\u0027]?sections["\u0027]?)\s*:\s*\[', source)
    fragment = source[section_match.end():] if section_match else ""
    ids = re.findall(r'\bid["\u0027]?\s*:\s*["\u0027]([^"\u0027]+)["\u0027]', fragment)
    titles = re.findall(r'\btitle["\u0027]?\s*:\s*["\u0027]([^"\u0027\n]+)', fragment)
    low = " ".join(titles).lower()
    flags = []
    if not ids:
        flags.append("sem seções estruturadas")
    elif len(ids) < 18:
        flags.append("menos de 18 seções (" + str(len(ids)) + ")")
    if len(ids) != len(set(ids)):
        flags.append("IDs de seção duplicados")
    leading = [int(m.group(1)) for title in titles if (m := re.match(r"^\s*(\d+)\.", title))]
    doubles = sorted(n for n, count in collections.Counter(leading).items() if count > 1)
    if doubles:
        flags.append("numeração repetida: " + ", ".join(map(str, doubles)))
    for label, words in (
        ("leitura bíblica", ("leitura", "tradução livre")),
        ("contexto", ("contexto",)),
        ("interpretação", ("interpreta", "exegese", "exposição")),
        ("aplicação", ("aplica",)),
        ("exercícios", ("exercício", "perguntas")),
        ("oficina do pregador", ("pregador", "pregação", "mensagem")),
        ("oração", ("oração", "oracao")),
    ):
        if not any(word in low for word in words):
            flags.append("revisar ausência de " + label)
    before_sections = source[:section_match.start()] if section_match else source
    blank_keys = []
    for key in ("intro", "historicalContext", "application", "conclusion", "prayer"):
        if re.search(r'(?:["\u0027]?' + key + r'["\u0027]?)\s*:\s*["\u0027]\s*["\u0027]', before_sections):
            blank_keys.append(key)
    for key in ("keyPoints", "crossReferences", "questions"):
        if re.search(r'(?:["\u0027]?' + key + r'["\u0027]?)\s*:\s*\[\s*\]', before_sections):
            blank_keys.append(key)
    if blank_keys:
        flags.append("campos principais vazios: " + ", ".join(blank_keys))
    return {"sections": len(ids), "flags": flags}

def audit():
    books = parse_books()
    prefixes = parse_prefixes()
    catalog = CATALOG.read_text(encoding="utf-8")
    registered = re.findall(r'["\u0027]((?:genesis-1-criacao|biblia-[a-z0-9-]+-cap-\d+))["\u0027]\s*:', catalog)
    known = set(registered)
    rows = []
    issues = []
    known_slugs = set()
    total_existing = 0
    for book in books:
        slug = book["slug"]
        prefix = prefixes.get(slug)
        if not prefix:
            raise ValueError("Livro não mapeado no gerador: " + slug)
        missing = []
        orphan = []
        for chapter in range(1, book["chapters"] + 1):
            chapter_slug = slug_for(slug, chapter)
            known_slugs.add(chapter_slug)
            path = CONTENT / (prefix + "-" + str(chapter) + "-study.ts")
            file_exists = path.is_file()
            in_catalog = chapter_slug in known
            if not file_exists or not in_catalog:
                missing.append(chapter)
                if file_exists != in_catalog:
                    orphan.append(chapter)
            if file_exists:
                total_existing += 1
                review = audit_study(path)
                if review["flags"]:
                    issues.append({"book": book["name"], "chapter": chapter, "file": path.relative_to(ROOT).as_posix(), **review})
        rows.append({**book, "existing": book["chapters"] - len(missing), "missing": missing, "out_of_sync": orphan})
    extra_slugs = sorted(known - known_slugs)
    duplicates = sorted(slug for slug, n in collections.Counter(registered).items() if n > 1)
    summary = {
        "books": len(books),
        "chapters": sum(x["chapters"] for x in rows),
        "studies_integrated": sum(x["existing"] for x in rows),
        "files_found": total_existing,
        "missing": sum(len(x["missing"]) for x in rows),
        "books_with_any_study": sum(x["existing"] > 0 for x in rows),
        "books_complete_in_catalog": sum(not x["missing"] for x in rows),
        "chapters_flagged_for_editorial_review": len(issues),
        "catalog_entries": len(registered),
        "duplicate_catalog_slugs": duplicates,
        "unknown_catalog_slugs": extra_slugs,
    }
    return {"summary": summary, "books": rows, "review": issues}

def make_markdown(result):
    s = result["summary"]
    lines = [
        "# Auditoria dos estudos bíblicos — Gênesis a Apocalipse",
        "",
        "Auditoria estática do repositório. Não verifica automaticamente a correção de exegese,",
        "o conteúdo de cada versículo ou o uso apropriado de referências; revisão humana é necessária.",
        "Os estudos existentes não foram alterados por esta ferramenta.",
        "",
        "## Cobertura",
        "",
        "| Indicador | Quantidade |", "|---|---:|",
        "| Livros no índice | " + str(s["books"]) + " |",
        "| Capítulos bíblicos | " + str(s["chapters"]) + " |",
        "| Capítulos integrados ao catálogo | " + str(s["studies_integrated"]) + " |",
        "| Capítulos sem estudo integrado | " + str(s["missing"]) + " |",
        "| Livros com algum estudo | " + str(s["books_with_any_study"]) + " |",
        "| Livros com todos os capítulos cadastrados | " + str(s["books_complete_in_catalog"]) + " |",
        "| Estudos sinalizados para revisão editorial | " + str(s["chapters_flagged_for_editorial_review"]) + " |",
        "",
        "## Lacunas por livro",
        "",
        "| Livro | Estudos / capítulos | Capítulos pendentes |", "|---|---:|---|",
    ]
    for row in result["books"]:
        lines.append("| " + row["name"] + " | " + str(row["existing"]) + "/" + str(row["chapters"]) + " | " + ranges(row["missing"]) + " |")
    lines.extend(["", "## Alertas de integridade", ""])
    if s["duplicate_catalog_slugs"] or s["unknown_catalog_slugs"]:
        lines.append("- Slugs duplicados: " + ", ".join(s["duplicate_catalog_slugs"]))
        lines.append("- Slugs desconhecidos: " + ", ".join(s["unknown_catalog_slugs"]))
    for row in result["books"]:
        if row["out_of_sync"]:
            lines.append("- " + row["name"] + ": arquivo e registro divergentes nos capítulos " + ranges(row["out_of_sync"]))
    if not any(row["out_of_sync"] for row in result["books"]) and not s["duplicate_catalog_slugs"] and not s["unknown_catalog_slugs"]:
        lines.append("Nenhuma divergência evidente entre arquivos esperados e registros de capítulo.")
    lines.extend(["", "## Estudos que exigem revisão editorial estática", ""])
    if not result["review"]:
        lines.append("Nenhum alerta detectado pelo verificador estrutural.")
    else:
        for item in result["review"]:
            lines.append("- **" + item["book"] + " " + str(item["chapter"]) + "** (" + str(item["sections"]) + " seções): " + "; ".join(item["flags"]))
    lines.extend(["", "## Critério editorial", "",
        "Um capítulo só pode ser marcado como **aprovado** após revisão real da leitura de todos os versículos,",
        "da cobertura das perícopes, do contexto histórico, da fidelidade das referências, da distinção",
        "entre texto e interpretação, das aplicações, da conexão com Cristo e do esboço de pregação.",
        "Contagens e comprimento de texto não provam precisão teológica nem profundidade.", ""])
    return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", help="Caminho do relatório Markdown")
    parser.add_argument("--json-output", help="Caminho do relatório JSON")
    parser.add_argument("--fail-on-structural", action="store_true", help="Falha só em divergências de catálogo, nunca por dívida editorial anterior")
    args = parser.parse_args()
    result = audit()
    summary = result["summary"]
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    if args.output:
        target = pathlib.Path(args.output)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(make_markdown(result), encoding="utf-8")
    if args.json_output:
        target = pathlib.Path(args.json_output)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.fail_on_structural and (summary["duplicate_catalog_slugs"] or summary["unknown_catalog_slugs"] or any(row["out_of_sync"] for row in result["books"])):
        sys.exit(1)

if __name__ == "__main__":
    main()
