import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const curatedSource = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const genesis1Source = readFileSync(new URL("../src/lib/content/genesis-1-study.ts", import.meta.url), "utf8");
const handlerSource = readFileSync(new URL("../src/lib/ai.functions.ts", import.meta.url), "utf8");

test("Genesis 1 is registered and contains a structured, didactic study", () => {
  assert.match(curatedSource, /"genesis-1-criacao": genesis1Study/);
  assert.match(curatedSource, /from "\.\/genesis-1-study"/);
  assert.match(genesis1Source, /version: 4/);
  assert.match(genesis1Source, /title: "1\. Introdução/);
  assert.match(genesis1Source, /title: "2\. Contexto histórico/);
  assert.match(genesis1Source, /title: "4\. Tópico 1/);
  assert.match(genesis1Source, /title: "12\. Tópico 9/);
  assert.match(genesis1Source, /title: "21\. Exercícios/);
  assert.match(genesis1Source, /title: "22\. Oficina do pregador/);
  const numberedTitles = [...genesis1Source.matchAll(/title: "(\d+)\./g)].map((match) => Number(match[1]));
  assert.equal(new Set(numberedTitles).size, numberedTitles.length, "Genesis 1 section numbers must not repeat");
  assert.equal((genesis1Source.match(/id: "topico-/g) ?? []).length, 9);
  assert.match(genesis1Source, /id: "leitura-biblica-completa"/);
  assert.match(genesis1Source, /id: "palavras-chave"/);
  assert.match(genesis1Source, /id: "questoes-interpretativas"/);
  assert.match(genesis1Source, /id: "referencias-explicadas"/);
  assert.match(genesis1Source, /id: "erros-interpretacao"/);
  assert.equal(genesis1Source.includes("**Explicação:**`"), false, "Explanatory prose must remain inside each section template literal");
  assert.match(genesis1Source, /Elohim/);
  assert.match(genesis1Source, /não prova a doutrina da Trindade/);
  assert.match(genesis1Source, /não menciona uma guerra entre Deus e Satanás/);
  for (let verse = 1; verse <= 31; verse += 1) {
    assert.match(genesis1Source, new RegExp(`\\*\\*${verse}\\*\\*`), `Genesis 1 verse ${verse} must be included`);
  }
  for (const reference of ["Gênesis 1:1-2", "Gênesis 1:3-5", "Gênesis 1:6-8", "Gênesis 1:9-13", "Gênesis 1:14-19", "Gênesis 1:20-23", "Gênesis 1:24-28", "Gênesis 1:29-30", "Gênesis 1:31"]) {
    assert.ok(genesis1Source.includes(`Texto bíblico — ${reference}`), `Teaching topic must display ${reference}`);
  }
});

test("study loader returns curated content when managed content lookup fails", () => {
  const loader = handlerSource.slice(
    handlerSource.indexOf("export const getStudyContent"),
    handlerSource.indexOf("export const searchScriptures"),
  );

  assert.match(loader, /catch \(error\)[\s\S]*if \(curated\) return curated/);
  assert.match(loader, /CURATED_STUDIES\[data\.slug\]/);
});


test("devotional pipeline always has a local fallback for backend and AI failures", () => {
  const devotional = handlerSource.slice(
    handlerSource.indexOf("export const getDevotional"),
    handlerSource.indexOf("export const getPlanDayContent"),
  );

  assert.match(devotional, /const \{ fallbackDevotional \} = await import\("\.\/content\/fallback-devotional"\)/);
  assert.match(devotional, /catch \(error\)[\s\S]*return fallbackDevotional\(data\.day\)/);
  assert.match(devotional, /catch \(aiError\)[\s\S]*return fallbackDevotional\(data\.day\)/);
});

test("reviewed local chapter studies cannot be hidden by archived managed catalog rows", () => {
  const detailRoute = readFileSync(
    new URL("../src/routes/_authenticated/estudos.$slug.tsx", import.meta.url),
    "utf8",
  );

  assert.match(detailRoute, /resolveManagedStudy\(legacyStudy, managedStudy, Boolean\(CURATED_STUDIES\[slug\]\)\)/);
  const catalogSource = readFileSync(new URL("../src/lib/content/managed-study-catalog.ts", import.meta.url), "utf8");
  assert.match(catalogSource, /if \(!managed \|\| isCurated\) return local/);
  assert.match(catalogSource, /if \(managed\.status === "archived"\) return undefined/);
});


test("Psalm 121 is integrated and passes the deep-study structural baseline", () => {
  assert.match(curatedSource, /"biblia-salmos-cap-121": psalm121Study/);
  assert.match(curatedSource, /from "\.\/psalm-121-study"/);
  const source = readFileSync(new URL("../src/lib/content/psalm-121-study.ts", import.meta.url), "utf8");
  const start = source.indexOf(" = {\n");
  const end = source.lastIndexOf(";\n");
  assert.ok(start >= 0 && end > start, "The study should be stored as a static JSON-like object");
  const study = JSON.parse(source.slice(start + 3, end));
  assert.equal(study.version, 5);
  assert.equal(study.depth, "deep");
  assert.ok(study.sections.length >= 26);
  assert.ok(study.keyPoints.length >= 8);
  assert.ok(study.crossReferences.length >= 12);
  assert.ok(study.questions.length >= 15);
  for (const [field, minimum] of Object.entries({
    intro: 1200,
    historicalContext: 900,
    application: 1000,
    conclusion: 500,
    prayer: 100,
  })) {
    assert.ok(study[field].length >= minimum, field + " must include sufficient original teaching");
  }
  const ids = study.sections.map((section) => section.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(study.sections.every((section) => section.body.length >= 500));
  const reading = study.sections.find((section) => section.id === "leitura-biblica");
  assert.ok(reading);
  for (let verse = 1; verse <= 8; verse += 1) {
    assert.ok(reading.body.includes("**" + verse + "**"), "Psalm 121 verse " + verse + " must be included");
  }
});
