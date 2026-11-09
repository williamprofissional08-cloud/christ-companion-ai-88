#!/usr/bin/env python3
"""Generate sequential, validated curated Genesis studies using GitHub Models."""
import json
import os
import pathlib
import re
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(".")
REPO = os.environ.get("GITHUB_REPOSITORY", "")
TOKEN = os.environ.get("GH_TOKEN", "").strip()
MODEL = os.environ.get("MODEL", "openai/gpt-4.1").strip()
START = int(os.environ.get("START_CHAPTER", "24"))
COUNT = int(os.environ.get("BATCH_SIZE", "7"))
CATALOG = ROOT / "src/lib/content/curated-studies.ts"
BOOKS = ROOT / "src/lib/content/bible-books.ts"

if not TOKEN:
    raise SystemExit("GH_TOKEN ausente. Verifique permissions: models: read.")
if START < 1 or START > 50 or COUNT < 1 or COUNT > 7 or START + COUNT - 1 > 50:
    raise SystemExit("Intervalo inválido: Gênesis tem 50 capítulos; lote permitido de 1 a 7.")
if not CATALOG.exists() or not BOOKS.exists():
    raise SystemExit("Estrutura de conteúdo não encontrada; execução interrompida.")

catalog = CATALOG.read_text(encoding="utf-8")
book_source = BOOKS.read_text(encoding="utf-8")
if "export const CURATED_STUDIES" not in catalog:
    raise SystemExit("Catálogo curado não reconhecido.")

def ask_model(chapter: int) -> dict:
    prompt = f"""
Produza um estudo bíblico EXEGÉTICO, profundo, didático e editorialmente responsável de Gênesis {chapter}, em português brasileiro, para formação bíblica avançada e preparação de pregadores.
Use Gênesis 1 como referência editorial de profundidade e Gênesis 23 como referência da estrutura TypeScript existente. O capítulo precisa ser estudado em seu contexto imediato e no desenvolvimento de Gênesis e do cânon bíblico.
Não invente fatos históricos, arqueológicos, hebraicos, datas, autores ou referências. Identifique claramente o que é dado textual, contexto provável, inferência, interpretação e hipótese. Quando houver divergência relevante, explique as leituras sem caricatura e sem declarar certeza indevida. Não alegorize detalhes sem apoio textual. Não transforme promessas particulares em garantias individuais. Não faça aplicações que legitimem violência, exploração ou abuso.
Retorne SOMENTE um objeto JSON válido, sem markdown, com exatamente estas propriedades:
{{
 "version": 1, "depth": "deep",
 "intro": "introdução substancial (mínimo 900 caracteres), tese central e orientação de leitura",
 "historicalContext": "contexto literário, histórico e cultural (mínimo 600 caracteres), com limites da evidência",
 "keyPoints": [{{"title":"...","text":"..."}}], 
 "application": "aplicação pastoral e contemporânea responsável (mínimo 700 caracteres)",
 "crossReferences": ["referência bíblica — relação explicada"],
 "questions": ["pergunta de compreensão/exegese"],
 "conclusion": "síntese teológica e cristocêntrica cuidadosa (mínimo 300 caracteres)",
 "prayer": "oração coerente com o capítulo, sem promessas inventadas",
 "sections": [{{"id":"slug-unico","title":"...","body":"texto aprofundado","kind":"exegesis|context|theology|pastoral|application|method|glossary|exercise","scriptureRefs":["Gênesis {chapter}:1"],"confidence":"high|probable|debated|uncertain","collapsible":true}}]
}}
Requisitos mínimos: 8 keyPoints; 10 crossReferences relevantes e corretas; 12 perguntas; 18 sections substanciais, organizadas com progressão lógica. Inclua delimitação e estrutura literária, análise por perícope/versículos, palavras/conceitos importantes sem etimologias especulativas, contexto histórico com ressalvas, teologia bíblica, relação com Cristo somente quando sustentada pelo cânon, erros interpretativos comuns, aplicações, método de estudo, esboço expositivo, glossário e avaliação. Cada section deve ter body de pelo menos 350 caracteres, salvo itens de glossário/exercício. Evite repetição para atingir contagem.
O texto bíblico deve ser consultado pelo leitor em sua tradução licenciada; não reproduza longos trechos de traduções protegidas. Referências no formato Livro capítulo:versículos. Seja específico ao capítulo {chapter}, não escreva um estudo genérico.
"""
    payload = json.dumps({
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "Você é exegeta bíblico e editor acadêmico cuidadoso. Fidelidade textual, honestidade epistemológica e qualidade didática são prioritárias. Retorne apenas JSON válido."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 16000
    }).encode()
    req = urllib.request.Request(
        "https://models.github.ai/inference/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json", "Accept": "application/json", "Authorization": "Bearer " + TOKEN}
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=240) as response:
                response_body = response.read().decode("utf-8", "replace")
            result = json.loads(response_body)
            choices = result.get("choices") or []
            if not choices:
                raise ValueError(
                    "API não retornou choices; "
                    f"model={result.get('model')!r}, id={result.get('id')!r}, "
                    f"resposta={response_body[:700]!r}"
                )
            choice = choices[0]
            message = choice.get("message") or {}
            raw_content = message.get("content")
            if isinstance(raw_content, list):
                raw = "".join(
                    part.get("text", "") if isinstance(part, dict) else str(part)
                    for part in raw_content
                ).strip()
            elif isinstance(raw_content, str):
                raw = raw_content.strip()
            else:
                raw = ""
            if not raw:
                refusal = message.get("refusal")
                usage = result.get("usage")
                raise ValueError(
                    "GitHub Models retornou conteúdo vazio; "
                    f"finish_reason={choice.get('finish_reason')!r}, "
                    f"refusal={refusal!r}, usage={usage!r}, "
                    f"response_id={result.get('id')!r}, "
                    f"response_excerpt={response_body[:900]!r}"
                )
            raw = re.sub(r"^\\s*```(?:json)?\\s*", "", raw)
            raw = re.sub(r"\\s*```\\s*$", "", raw)
            data = json.loads(raw)
            validate_study(data, chapter)
            return data
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:1200]
            if exc.code in (401, 403):
                raise SystemExit(f"GitHub Models sem acesso (HTTP {exc.code}): {detail}")
            if exc.code not in (408, 429, 500, 502, 503, 504) or attempt == 2:
                raise SystemExit(f"GitHub Models HTTP {exc.code}: {detail}")
            time.sleep(15 * (attempt + 1))
        except (KeyError, IndexError, json.JSONDecodeError, TypeError, ValueError) as exc:
            if attempt == 2:
                raise SystemExit(f"Resposta inválida para Gênesis {chapter}: {exc}")
            print(
                f"Tentativa {attempt + 1}/3 sem resposta JSON utilizável "
                f"para Gênesis {chapter}: {exc}",
                flush=True,
            )
            time.sleep(5 * (attempt + 1))

def validate_study(data: dict, chapter: int):
    required = ["intro", "historicalContext", "keyPoints", "application", "crossReferences", "questions", "conclusion", "prayer", "sections"]
    if not isinstance(data, dict) or any(k not in data for k in required):
        raise ValueError("Campos obrigatórios ausentes.")
    limits = {"intro": 900, "historicalContext": 600, "application": 700, "conclusion": 300}
    for key, minimum in limits.items():
        if not isinstance(data[key], str) or len(data[key]) < minimum:
            raise ValueError(f"{key} abaixo do mínimo de {minimum} caracteres.")
    if len(data["keyPoints"]) < 8 or len(data["crossReferences"]) < 10 or len(data["questions"]) < 12 or len(data["sections"]) < 18:
        raise ValueError("Quantidade mínima de tópicos, referências, perguntas ou seções não atingida.")
    for section in data["sections"]:
        if not isinstance(section, dict) or not all(k in section for k in ("id", "title", "body", "kind", "confidence")):
            raise ValueError("Seção com estrutura incompleta.")
        if len(section["body"]) < 250:
            raise ValueError(f"Seção superficial: {section.get('title', 'sem título')}")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", section["id"]):
            raise ValueError("ID de seção inválido.")
    if data.get("depth") != "deep":
        raise ValueError("O estudo precisa estar marcado como deep.")

def main():
    global catalog
    for chapter in range(START, START + COUNT):
        path = ROOT / f"src/lib/content/genesis-{chapter}-study.ts"
        if path.exists() or f"biblia-genesis-cap-{chapter}" in catalog:
            raise SystemExit(f"Gênesis {chapter} já existe no catálogo/arquivos. Nada foi sobrescrito.")
        print(f"Gerando Gênesis {chapter} com {MODEL}...", flush=True)
        study = ask_model(chapter)
        symbol = f"genesis{chapter}Study"
        path.write_text(
            'import type { StudyContent } from "../types";\n\n'
            + f"export const {symbol}: StudyContent = "
            + json.dumps(study, ensure_ascii=False, indent=2)
            + ";\n",
            encoding="utf-8"
        )
        import_line = f'import {{ {symbol} }} from "./genesis-{chapter}-study";'
        catalog = catalog.replace(
            'import { genesis1Study } from "./genesis-1-study";',
            import_line + '\n' + 'import { genesis1Study } from "./genesis-1-study";'
        )
        entry = f'  "biblia-genesis-cap-{chapter}": {symbol},'
        catalog = catalog.replace(
            '  "biblia-genesis-cap-23": genesis23Study,',
            '  "biblia-genesis-cap-23": genesis23Study,\n' + entry
        )
        print(f"Gênesis {chapter}: estrutura validada ({len(study['sections'])} seções).", flush=True)
    CATALOG.write_text(catalog, encoding="utf-8")
    print(f"Lote Gênesis {START}–{START + COUNT - 1} gerado. Próximo passo: validação de build/testes.", flush=True)

if __name__ == "__main__":
    main()
