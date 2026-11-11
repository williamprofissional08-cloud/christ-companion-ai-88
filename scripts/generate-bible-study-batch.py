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
REFERENCE_PATH = ROOT / "src/lib/content/genesis-1-study.ts"
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
if not CATALOG_PATH.exists() or not BOOKS_PATH.exists() or not REFERENCE_PATH.exists():
    raise SystemExit("Catálogo, índice bíblico ou estudo de referência Gênesis 1 não encontrado.")

reference_source = REFERENCE_PATH.read_text(encoding="utf-8")
reference_titles = re.findall(r'\btitle\s*:\s*["\`]([^"\`]+)["\`]', reference_source)
reference_outline = "\n".join(f"- {title}" for title in reference_titles[-19:])
if len(reference_titles) < 15:
    raise SystemExit("O estudo de Gênesis 1 não forneceu uma estrutura editorial suficiente.")

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
Produza um estudo bíblico EXCEPCIONALMENTE profundo, completo, didático e editorialmente responsável de {reference}, em português brasileiro, para formação bíblica e preparação de pregadores.
PADRÃO EDITORIAL OBRIGATÓRIO: siga a profundidade, clareza, organização progressiva e didática do estudo de Gênesis 1 existente no repositório. Use TODA a estrutura abaixo como referência de abrangência, sem copiar seu conteúdo nem forçar a mesma divisão quando o gênero do capítulo exigir outra organização:
{reference_outline}

O aluno deve compreender o texto, explicar cada unidade e preparar uma exposição bíblica. Não entregue resumo superficial nem conteúdo genérico reutilizável.
Livro: {book["name"]}; testamento: {book["testament"]}; categoria: {book["category"]}; capítulo {chapter} de {book["chapters"]}. Respeite o gênero literário, o contexto do livro e a progressão do capítulo.

REQUISITOS EDITORIAIS INEGOCIÁVEIS:
1. Faça leitura integral, cobrindo todos os versículos. Inclua seção de leitura em tradução livre/paráfrase própria, identificada claramente como tradução livre para estudo, sem reproduzir longos trechos de versões protegidas.
2. Divida o capítulo em perícopes/unidades literárias coerentes. Explique cada unidade com observação do texto, contexto, sentido, palavras-chave, conexões e aplicação. Nenhum trecho pode ficar sem explicação.
3. Inclua introdução e tese central; contexto histórico, geográfico e cultural com limites da evidência; gênero; estrutura; exposição detalhada; termos originais relevantes com cautela lexical; teologia do capítulo; relação com o livro e o cânon; conexão com Cristo quando sustentada; debates interpretativos; erros comuns; método de interpretação; glossário; aplicações; exercícios com respostas orientadoras; oficina do pregador com esboço expositivo; meditação e oração.
4. Diferencie o que o texto afirma, inferência provável, interpretação debatida e o que não pode ser afirmado com segurança. Não invente história, arqueologia, datas, autoria, etimologias ou referências. Não force tipologias, alegorias ou conexões com Cristo.
5. Não transforme promessas específicas em garantias individuais. Não legitime violência, exploração, racismo, abuso ou superstição. Apresente interpretações relevantes com equilíbrio.
6. Ensine: explique termos difíceis, contexto, lógica do argumento e por que cada detalhe importa. Evite repetição artificial, frases vazias e aplicações genéricas.
7. O esboço homilético deve nascer da estrutura do capítulo e ajudar o pregador a ensinar com fidelidade.

Retorne SOMENTE JSON válido com: version (5), depth ("deep"), intro (mínimo 1200 caracteres), historicalContext (mínimo 900), keyPoints (mínimo 8 objetos title/text específicos), application (mínimo 1000), crossReferences (mínimo 12 strings "Referência bíblica — explicação contextualizada"), questions (mínimo 15 strings com perguntas e respostas orientadoras), conclusion (mínimo 500), prayer (mínimo 100), sections (mínimo 26 objetos com id, title, body, kind, scriptureRefs, confidence, collapsible).
Cada seção deve ter body de pelo menos 500 caracteres, referências bíblicas pertinentes e conteúdo específico do capítulo. A estrutura deve incluir, em seções próprias quando pertinente: leitura integral; introdução; contexto; estrutura; exposição sequencial de todas as perícopes; palavras-chave/idioma original quando relevante; questões interpretativas; referências cruzadas explicadas; cuidados contra erros; relação com Cristo somente quando sustentada; aplicação; síntese; exercícios respondidos; oficina de pregação; meditação e oração. Não use uma seção genérica para substituir várias dessas etapas. IDs únicos em kebab-case. Use kinds: exegesis, context, theology, pastoral, application, method, glossary, exercise; confidence: high, probable, debated, uncertain.
A seção de leitura deve identificar os versículos/intervalos cobertos. A exposição deve cobrir sequencialmente todas as perícopes até o último versículo. Inclua síntese, exercícios respondidos, esboço expositivo, meditação e oração. Não invente dados para atingir quantidade mínima; declare quando a evidência for limitada.
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
    for key, minimum in {"intro": 1200, "historicalContext": 900, "application": 1000, "conclusion": 500, "prayer": 100}.items():
        if not isinstance(data[key], str) or len(data[key]) < minimum:
            raise ValueError(f"{key} abaixo do mínimo de {minimum} caracteres.")
    if not all(isinstance(item, str) and item.strip() for item in data["crossReferences"]):
        raise ValueError("crossReferences deve conter somente strings não vazias.")
    if not all(isinstance(item, str) and item.strip() for item in data["questions"]):
        raise ValueError("questions deve conter somente strings não vazias.")
    if data.get("version") != 5 or data.get("depth") != "deep" or len(data["keyPoints"]) < 8 or len(data["crossReferences"]) < 12 or len(data["questions"]) < 15 or len(data["sections"]) < 26:
        raise ValueError("Profundidade ou quantidade mínima não atingida.")
    ids = set()
    for section in data["sections"]:
        if not isinstance(section, dict) or not all(key in section for key in ("id", "title", "body", "kind", "confidence", "scriptureRefs")):
            raise ValueError("Seção incompleta: exige id, title, body, kind, confidence e scriptureRefs.")
        if not isinstance(section["scriptureRefs"], list) or not section["scriptureRefs"] or not all(isinstance(ref, str) and ref.strip() for ref in section["scriptureRefs"]):
            raise ValueError("Cada seção precisa conter referências bíblicas específicas e não vazias.")
        if len(section["body"]) < 500 or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", section["id"]) or section["id"] in ids:
            raise ValueError("Seção superficial (mínimo 500 caracteres) ou ID inválido/duplicado.")
        if section.get("kind") not in ("scripture", "introduction", "context", "exegesis", "theology", "pastoral", "application", "method", "glossary", "exercise", "analysis", "meditation", "reference"):
            raise ValueError("Tipo de seção inválido ou não reconhecido.")
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
