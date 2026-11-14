import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/lib/content/psalm-123-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const start = source.indexOf(" = {\n");
const end = source.lastIndexOf(";\n");
assert.ok(start >= 0 && end > start, "Salmos 123 deve possuir conteúdo estático auditável");
const study = JSON.parse(source.slice(start + 3, end));

test("Salmos 123 é profundo e cobre cada um de seus quatro versículos", () => {
  assert.equal(study.version, 5);
  assert.equal(study.depth, "deep");
  assert.ok(study.sections.length >= 26);
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
    assert.ok(study[field].length >= min, field + " abaixo do padrão editorial");
  }

  const ids = study.sections.map((section) => section.id);
  assert.equal(new Set(ids).size, ids.length, "IDs de seção repetidos");
  assert.ok(study.sections.every((section) => section.body.length >= 500));
  const reading = study.sections.find((section) => section.id === "leitura-biblica");
  assert.ok(reading, "Leitura bíblica ausente");
  assert.match(reading.body, /Paráfrase livre/);
  for (let verse = 1; verse <= 4; verse++) {
    assert.ok(reading.body.includes("**" + verse + "**"), "Versículo " + verse + " ausente");
  }

  const titles = study.sections.map((section) => section.title);
  assert.equal(new Set(titles).size, titles.length, "Títulos de seção repetidos");
  const numbered = titles.map((title) => title.match(/^(\d+)\./)?.[1]).filter(Boolean).map(Number);
  assert.deepEqual(numbered, Array.from({ length: 35 }, (_, index) => index + 1));
});

test("Salmos 123 interpreta misericórdia, desprezo e espera sem alegar resposta imediata", () => {
  const body = study.sections.map((section) => section.body).join("\n").toLowerCase();
  for (const required of ["misericórdia", "desprezo", "zombaria", "até", "cristo", "servos", "jesus"]) {
    assert.ok(body.includes(required), "Tema ausente: " + required);
  }
  assert.ok(body.includes("não") && body.includes("resposta"), "Evitar promessas não fundamentadas");
  assert.ok(study.crossReferences.some((ref) => ref.startsWith("Hebreus 4:14-16")));
  assert.ok(study.crossReferences.some((ref) => ref.startsWith("Salmos 25:15-16")));
});

test("Salmos 123 está integrado uma única vez ao catálogo", () => {
  assert.match(catalog, /import \{ psalm123Study \} from "\.\/psalm-123-study";/);
  const matches = catalog.match(/"biblia-salmos-cap-123": psalm123Study/g) ?? [];
  assert.equal(matches.length, 1);
});
