#!/usr/bin/env python3
"""Generate missing curated chapter studies for any of the 66 Bible books."""
import json
import os
import pathlib
import re
import socket
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(".")
TOKEN = os.environ.get("GEMINI_API_KEY", "").strip()
MODEL = os.environ.get("MODEL", "gemini-3.8-flash").strip()
BOOK_SLUG = os.environ.get("BOOK_SLUG", "numbers").strip().lower()
START = int(os.environ.get("START_CHAPTER", "21"))
COUNT = int(os.environ.get("BATCH_SIZE", "7"))
CATALOG_PATH = ROOT / "src/lib/content/curated-studies.ts"
BOOKS_PATH = ROOT / "src/lib/content/bible-books.ts"
CONTENT_DIR = ROOT / "src/lib/content"

PREFIX = {
    "genesis": "genesis", "exodo": "exodus", "levitico": "leviticus",
    "numeros": "numbers", "deuteronomio": "deuteronomy", "josue": "joshua",
    "juizes": "judges", "rute": "ruth", "1-samuel": "1-samuel",
    "2-samuel": "2-samuel", "1-reis": "1-kings", "2-reis": "2-kings",
    "1-cronicas": "1-chronicles", "2-cronicas": "2-chronicles",
    "esdras": "ezra", "neemias": "nehemiah", "ester": "esther",
    "jo": "job", "salmos": "psalms", "proverbios": "proverbs",
    "eclesiastes": "ecclesiastes", "cantico-dos-canticos": "song-of-solomon",
    "isaias": "isaiah", "jeremias": "jeremiah", "lamentacoes": "lamentations",
    "ezequiel": "ezekiel", "daniel": "daniel", "oseias": "hosea",
    "joel": "joel", "amos": "amos", "obadias": "obadiah", "jonas": "jonah",
    "miqueias": "micah", "naum": "nahum", "habacuque": "habakkuk",
    "sofonias": "zephaniah", "ageu": "haggai", "zacarias": "zechariah",
    "malaquias": "malachi", "mateus": "matthew", "marcos": "mark",
    "lucas": "luke", "joao": "john", "atos": "acts", "romanos": "romans",
    "1-corintios": "1-corinthians", "2-corintios": "2-corinthians",
    "galatas": "galatians", "efesios": "ephesians", "filipenses": "philippians",
    "colossenses": "colossians", "1-tessalonicenses": "1-thessalonians",
    "2-tessalonicenses": "2-thessalonians", "1-timoteo": "1-timothy",
    "2-timoteo": "2-timothy", "tito": "titus", "filemom": "philemon",
    "hebreus": "hebrews", "tiago": "james", "1-pedro": "1-peter",
    "2-pedro": "2-peter", "1-joao": "1-john", "2-joao": "2-john",
    "3-joao": "3-john", "judas": "jude", "apocalipse": "revelation",
}

if not TOKEN:
    raise SystemExit("GEMINI_API_KEY ausente. Cadastre o segredo GEMINI_API_KEY em Settings > Secrets and variables > Actions.")
if not 1 <= COUNT <= 7:
    raise SystemExit("O lote deve examinar de 1 a 7 capítulos.")
if not CATALOG_PATH.exists() or not BOOKS_PATH.exists():
    raise SystemExit("Catálogo ou índice bíblico não encontrado.")

book_source = BOOKS_PATH.read_text(encoding="utf-8")
catalog = CATALOG_PATH.read_text(encoding="utf-8")
book_objects = re.findall(r"\{([^{}]*\bslug\s*:[^{}]*)\}", book_source, re.S)
books = {}
for item in book_objects:
    fields = {
        "slug": re.search(r'\bslug\s*:\s*"([^"]+)"', item),
        "name": re.search(r'\bname\s*:\s*"([^"]+)"', item),
        "chapters": re.search(r'\bchapters\s*:\s*(\d+)', item),
        "testament": re.search(r'\btestament\s*:\s*"([^"]+)"', item),
        "category": re.search(r'\bcategory\s*:\s*"([^"]+)"', item),
    }
    if all(fields.values()):
        slug = fields["slug"].group(1)
        books[slug] = {
            "name": fields["name"].group(1),
            "chapters": int(fields["chapters"].group(1)),
            "testament": fields["testament"].group(1),
            "category": fields["category"].group(1),
        }
if len(books) != 66:
    raise SystemExit(f"Índice bíblico deveria conter 66 livros; encontrados {len(books)}.")
if BOOK_SLUG not in books or BOOK_SLUG not in PREFIX:
    raise SystemExit(f"Slug não reconhecido: {BOOK_SLUG}.")
book = books[BOOK_SLUG]
if START < 1 or START > book["chapters"]:
    raise SystemExit("Capítulo inicial fora dos limites do livro.")
END = min(START + COUNT - 1, book["chapters"])
file_prefix = PREFIX[BOOK_SLUG]

def slug_for(chapter):
    if BOOK_SLUG == "genesis" and chapter == 1:
        return "genesis-1-criacao"
    return f"biblia-{BOOK_SLUG}-cap-{chapter}"

def symbol_for(chapter):
    base = re.sub(r"[^a-zA-Z0-9]", "", file_prefix.title())
    if base[:1].isdigit():
        base = "Book" + base
    return f"{base}{chapter}Study"

def ask_model(chapter):
    reference = f'{book["name"]} {chapter}'
    prompt = f"""
Produza um estudo bíblico exegético, profundo, didático e editorialmente responsável de {reference}, em português brasileiro, para formação bíblica e preparação de pregadores.
PADRÃO OBRIGATÓRIO: use Gênesis 1 como referência editorial de profundidade, clareza, progressão pedagógica e organização. Ensine o aluno a compreender o texto, não apenas resuma. Desenvolva a leitura por perícopes/unidades literárias e explique cada unidade com rigor e linguagem acessível.
Livro: {book["name"]}; testamento: {book["testament"]}; categoria: {book["category"]}; capítulo {chapter} de {book["chapters"]}. Respeite o gênero literário.
Não invente fatos históricos, arqueológicos, linguísticos, datas, autoria ou referências. Distinga dados explícitos do texto, contexto provável, inferência, interpretação debatida e hipótese. Apresente divergências relevantes com justiça. Não alegorize detalhes sem base. Não force conexões com Cristo: use apenas quando sustentadas pelo texto e pelo cânon. Não transforme promessas particulares em garantias individuais. Não legitime violência, exploração ou abuso. Não reproduza longos trechos de traduções protegidas.
Retorne SOMENTE JSON válido com: version (4), depth ("deep"), intro (mínimo 900 caracteres), historicalContext (700), keyPoints (mínimo 8 objetos title/text), application (800), crossReferences (mínimo 12 strings no formato "Referência bíblica — explicação"), questions (mínimo 15 strings contendo perguntas completas). NÃO retorne objetos nessas duas listas; cada item deve ser string., conclusion (400), prayer (80), sections (mínimo 22 objetos com id, title, body, kind, scriptureRefs, confidence, collapsible).
As seções devem cobrir: introdução e tese; contexto literário/histórico e limites da evidência; gênero; estrutura; exposição por perícope/versículos; termos importantes sem etimologia especulativa; teologia do capítulo; relação com o livro e cânon; debates interpretativos; erros de leitura; aplicações; método de interpretação; glossário; exercícios/avaliação; esboço expositivo; meditação e síntese. Cada body com pelo menos 250 caracteres. Evite repetição artificial.
Use kinds: exegesis, context, theology, pastoral, application, method, glossary, exercise. confidence: high, probable, debated, uncertain. Identificadores únicos em kebab-case. Referências bíblicas verificáveis. Texto claro e específico ao capítulo.
"""
    payload = json.dumps({
        "systemInstruction": {"parts": [{"text": "Você é exegeta bíblico, professor e editor teológico. Fidelidade textual, honestidade epistemológica, profundidade e clareza didática são prioritárias. Responda apenas JSON válido."}]},
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 20000, "responseMimeType": "application/json"}
    }).encode()
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
    request = urllib.request.Request(endpoint, data=payload,
        headers={"Content-Type": "application/json", "Accept": "application/json", "x-goog-api-key": TOKEN})
    max_attempts = 4
    for attempt in range(max_attempts):
        try:
            print(f"Consultando Gemini para {reference} (tentativa {attempt + 1}/{max_attempts})...", flush=True)
            with urllib.request.urlopen(request, timeout=600) as response:
                body = response.read().decode("utf-8", "replace")
            if not body.strip():
                raise ValueError("API Gemini retornou corpo vazio.")
            result = json.loads(body)
            candidates = result.get("candidates") or []
            if not candidates:
                feedback = result.get("promptFeedback") or {}
                raise ValueError(f"Gemini sem candidatos: {json.dumps(feedback, ensure_ascii=False)[:700]}")
            parts = (candidates[0].get("content") or {}).get("parts") or []
            raw = "".join(part.get("text", "") for part in parts if isinstance(part, dict))
            if not raw.strip():
                finish = candidates[0].get("finishReason", "desconhecido")
                raise ValueError(f"Gemini não retornou texto; finishReason={finish}")
            raw = re.sub(r'^\s*`{3}(?:json)?\s*', '', raw.strip())
            raw = re.sub(r'\s*`{3}\s*$', '', raw)
            data = json.loads(raw)
            normalize_study(data)
            validate(data)
            return data
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", "replace")[:1200]
            if error.code not in (408, 429, 500, 502, 503, 504) or attempt == max_attempts - 1:
                raise SystemExit(f"Gemini API HTTP {error.code}: {detail}")
            wait = min(20 * (2 ** attempt), 120)
            print(f"Gemini HTTP {error.code}; nova tentativa em {wait}s.", flush=True)
            time.sleep(wait)
        except (TimeoutError, socket.timeout, urllib.error.URLError) as error:
            if attempt == max_attempts - 1:
                raise SystemExit(f"Tempo de espera/rede esgotado para {reference} após {max_attempts} tentativas: {error}")
            wait = min(20 * (2 ** attempt), 120)
            print(f"Gemini demorou ou houve falha de rede ({error}); nova tentativa em {wait}s.", flush=True)
            time.sleep(wait)
        except (ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
            if attempt == max_attempts - 1:
                raise SystemExit(f"Resposta inválida para {reference}: {error}")
            time.sleep(min(10 * (2 ** attempt), 60))

def normalize_study(data):
    """Adapt common Gemini object-shaped lists to the StudyContent string[] contract."""
    if not isinstance(data, dict):
        raise ValueError("A resposta principal do estudo precisa ser um objeto JSON.")

    references = data.get("crossReferences")
    if isinstance(references, list):
        normalized = []
        for item in references:
            if isinstance(item, str):
                normalized.append(item.strip())
            elif isinstance(item, dict):
                reference = item.get("ref") or item.get("reference") or item.get("verse") or item.get("title")
                explanation = item.get("explanation") or item.get("note") or item.get("text") or item.get("reason")
                if reference and explanation:
                    normalized.append(f"{str(reference).strip()} — {str(explanation).strip()}")
                elif reference:
                    normalized.append(str(reference).strip())
                elif explanation:
                    normalized.append(str(explanation).strip())
                else:
                    raise ValueError("Referência cruzada em formato de objeto sem referência ou explicação.")
            else:
                raise ValueError("Cada referência cruzada precisa ser texto ou objeto reconhecível.")
        data["crossReferences"] = normalized

    questions = data.get("questions")
    if isinstance(questions, list):
        normalized = []
        for item in questions:
            if isinstance(item, str):
                normalized.append(item.strip())
            elif isinstance(item, dict):
                question = item.get("question") or item.get("prompt") or item.get("title")
                answer = item.get("answer") or item.get("response") or item.get("explanation")
                if question and answer:
                    normalized.append(f"{str(question).strip()} — Resposta orientadora: {str(answer).strip()}")
                elif question:
                    normalized.append(str(question).strip())
                else:
                    raise ValueError("Pergunta em formato de objeto sem campo question.")
            else:
                raise ValueError("Cada pergunta precisa ser texto ou objeto reconhecível.")
        data["questions"] = normalized


def validate(data):
    required = ["intro", "historicalContext", "keyPoints", "application", "crossReferences", "questions", "conclusion", "prayer", "sections"]
    if not isinstance(data, dict) or any(key not in data for key in required):
        raise ValueError("Campos obrigatórios ausentes.")
    for key, minimum in {"intro": 900, "historicalContext": 700, "application": 800, "conclusion": 400, "prayer": 80}.items():
        if not isinstance(data[key], str) or len(data[key]) < minimum:
            raise ValueError(f"{key} abaixo do mínimo de {minimum} caracteres.")
    if not all(isinstance(item, str) and item.strip() for item in data["crossReferences"]):
        raise ValueError("crossReferences deve conter somente strings não vazias.")
    if not all(isinstance(item, str) and item.strip() for item in data["questions"]):
        raise ValueError("questions deve conter somente strings não vazias.")
    if data.get("depth") != "deep" or len(data["keyPoints"]) < 8 or len(data["crossReferences"]) < 12 or len(data["questions"]) < 15 or len(data["sections"]) < 22:
        raise ValueError("Profundidade ou quantidade mínima não atingida.")
    ids = set()
    for section in data["sections"]:
        if not isinstance(section, dict) or not all(key in section for key in ("id", "title", "body", "kind", "confidence")):
            raise ValueError("Seção incompleta.")
        if len(section["body"]) < 250 or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", section["id"]) or section["id"] in ids:
            raise ValueError("Seção superficial ou ID inválido/duplicado.")
        if section["confidence"] not in ("high", "probable", "debated", "uncertain"):
            raise ValueError("Nível de confiança inválido.")
        ids.add(section["id"])

def main():
    global catalog
    imports = []
    entries = []
    generated = 0
    preserved = []
    for chapter in range(START, END + 1):
        slug = slug_for(chapter)
        symbol = symbol_for(chapter)
        path = CONTENT_DIR / f"{file_prefix}-{chapter}-study.ts"
        has_catalog_entry = re.search(r'["\']' + re.escape(slug) + r'["\']\s*:', catalog) is not None
        has_import = re.search(r'import\s*\{\s*' + re.escape(symbol) + r'\s*\}', catalog) is not None
        if has_catalog_entry and not path.exists():
            raise SystemExit(f"Inconsistência: {slug} consta no catálogo, mas arquivo ausente. Interrompido sem sobrescrever.")
        if path.exists():
            if not has_catalog_entry:
                if not has_import:
                    imports.append(f'import {{ {symbol} }} from "./{file_prefix}-{chapter}-study";')
                entries.append(f'  "{slug}": {symbol},')
            preserved.append(chapter)
            continue
        study = ask_model(chapter)
        path.write_text('import type { StudyContent } from "../types";\n\n' + f"export const {symbol}: StudyContent = " + json.dumps(study, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
        imports.append(f'import {{ {symbol} }} from "./{file_prefix}-{chapter}-study";')
        entries.append(f'  "{slug}": {symbol},')
        generated += 1
        print(f'Gerado {book["name"]} {chapter}: {len(study["sections"])} seções.', flush=True)
    if not imports and not entries:
        print(f"Nenhum capítulo novo; capítulos já existentes preservados: {preserved}.")
        return
    type_import = 'import type { StudyContent } from "../types";'
    if imports:
        catalog = catalog.replace(type_import, type_import + "\n" + "\n".join(imports), 1)
    marker = "export const CURATED_STUDIES: Record<string, StudyContent> = {"
    start = catalog.find(marker)
    close = catalog.find("\n};", start)
    if start < 0 or close < 0:
        raise SystemExit("Estrutura do catálogo não reconhecida.")
    if entries:
        catalog = catalog[:close] + "\n" + "\n".join(entries) + catalog[close:]
    CATALOG_PATH.write_text(catalog, encoding="utf-8")
    print(f"Lote concluído: {generated} novos; {len(preserved)} existentes preservados.", flush=True)

if __name__ == "__main__":
    main()
