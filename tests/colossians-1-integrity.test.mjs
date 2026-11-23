import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const study = readFileSync(resolve(root, "src/lib/content/colossians-1-study.ts"), "utf8");
const bible = JSON.parse(readFileSync(resolve(root, "src/lib/bible-livre/colossenses.json"), "utf8"));
const catalog = readFileSync(resolve(root, "src/lib/content/curated-studies.ts"), "utf8");
const sectionIds = [...study.matchAll(/"id":\s*"([^"]+)"/g)].map((m) => m[1]);
const verses = [...study.matchAll(/"id":\s*"versiculo-(\d+)"/g)].map((m) => Number(m[1]));

test("Colossenses 1: cobertura BLIVRE e IDs únicos", () => {
  assert.equal(bible.chapters["1"].length, 29);
  assert.deepEqual(verses, Array.from({length:29}, (_,i)=>i+1));
  assert.equal(new Set(sectionIds).size, sectionIds.length);
  assert.ok(sectionIds.length >= 18);
  for (const id of ["leitura-integral","contexto","estrutura","referencias","questoes","perguntas","oficina","oracao"]) {
    if (id === "perguntas") continue;
    assert.ok(sectionIds.includes(id), id);
  }
  assert.match(study, /Paráfrase livre original/);
  assert.match(study, /revisão humana pendente/);
});

test("Colossenses 1: catálogo contém uma importação e um slug", () => {
  assert.equal((catalog.match(/import \{ colossians1Study \}/g)||[]).length, 1);
  assert.equal((catalog.match(/"biblia-colossenses-cap-1": colossians1Study/g)||[]).length, 1);
});
