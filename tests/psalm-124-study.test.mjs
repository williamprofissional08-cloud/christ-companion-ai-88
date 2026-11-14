import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/lib/content/psalm-124-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const start = source.indexOf(" = {\n");
const end = source.lastIndexOf(";\n");
assert.ok(start >= 0 && end > start, "Salmos 124 deve possuir estudo estático auditável");
const study = JSON.parse(source.slice(start + 3, end));

test("Salmos 124 cobre todos os oito versículos e mantém profundidade editorial", () => {
  assert.equal(study.version, 5);
  assert.equal(study.depth, "deep");
  assert.ok(study.sections.length >= 30);
  assert.ok(study.keyPoints.length >= 8);
  assert.ok(study.questions.length >= 15);
  assert.ok(study.crossReferences.length >= 12);
  for (const [field, min] of Object.entries({
    intro: 1200,
    historicalContext: 900,
    application: 1000,
    conclusion: 500,
    prayer: 100,
  })) {
    assert.ok(study[field].length >= min, field + " abaixo da profundidade mínima");
  }

  const ids = study.sections.map((section) => section.id);
  const titles = study.sections.map((section) => section.title);
  assert.equal(new Set(ids).size, ids.length, "IDs repetidos");
  assert.equal(new Set(titles).size, titles.length, "Títulos repetidos");
  assert.ok(study.sections.every((section) => section.body.length >= 500), "Existe seção superficial");
  const reading = study.sections.find((section) => section.id === "leitura-biblica");
  assert.ok(reading);
  assert.match(reading.body, /Paráfrase livre/);
  for (let verse = 1; verse <= 8; verse++) {
    assert.ok(reading.body.includes("**" + verse + ".**"), "Versículo ausente: " + verse);
  }

  const numbered = titles
    .map((title) => title.match(/^(\d+)\./)?.[1])
    .filter(Boolean)
    .map(Number);
  assert.deepEqual(numbered, Array.from({ length: numbered.length }, (_, i) => i + 1));
  assert.equal(numbered.length, 41);
});

test("Salmos 124 distingue linguagem poética de promessas de livramento automático", () => {
  const body = study.sections.map((section) => section.body).join("\n").toLowerCase();
  for (const word of ["israel", "águas", "dentes", "armadilha", "socorro", "criador", "cristo"]) {
    assert.ok(body.includes(word), "Tema faltante: " + word);
  }
  assert.ok(body.includes("não"), "Cuidados interpretativos ausentes");
  assert.ok(study.crossReferences.some((reference) => reference.startsWith("Hebreus 11:32-40")));
  assert.ok(study.crossReferences.some((reference) => reference.startsWith("Salmos 121:2")));
});

test("Salmos 124 consta uma única vez do catálogo do Caminho Divino", () => {
  assert.match(catalog, /import \{ psalm124Study \} from "\.\/psalm-124-study";/);
  const matches = catalog.match(/"biblia-salmos-cap-124": psalm124Study/g) ?? [];
  assert.equal(matches.length, 1);
});
