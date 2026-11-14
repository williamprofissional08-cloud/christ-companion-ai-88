import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const studySource = readFileSync(new URL("../src/lib/content/psalm-125-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const jsonStart = studySource.indexOf(" = {\n");
const jsonEnd = studySource.lastIndexOf(";\n");
assert.ok(jsonStart > 0 && jsonEnd > jsonStart, "Missing static Psalm 125 study object");
const study = JSON.parse(studySource.slice(jsonStart + 3, jsonEnd));

test("Psalm 125 meets deep editorial and verse coverage checkpoints", () => {
  assert.equal(study.version, 5);
  assert.equal(study.depth, "deep");
  assert.ok(study.sections.length >= 26);
  assert.ok(study.keyPoints.length >= 8);
  assert.ok(study.questions.length >= 15);
  assert.ok(study.crossReferences.length >= 12);

  for (const [key, minLength] of Object.entries({
    intro: 1200,
    historicalContext: 900,
    application: 1000,
    conclusion: 500,
    prayer: 100,
  })) {
    assert.ok(study[key].length >= minLength, key + " below editorial minimum");
  }
  const ids = study.sections.map((section) => section.id);
  assert.equal(new Set(ids).size, ids.length, "Duplicate section ID");
  assert.ok(study.sections.every((section) => section.body.length >= 500));
  const reading = study.sections.find((section) => section.id === "leitura-biblica");
  assert.ok(reading);
  assert.match(reading.body, /Paráfrase livre/);
  for (let n = 1; n <= 5; n++) {
    assert.ok(reading.body.includes("**" + n + ".**"), "Missing Psalm 125 verse " + n);
  }
  const titles = study.sections.map((section) => section.title);
  assert.equal(new Set(titles).size, titles.length);
  const numbered = titles.map((title) => title.match(/^(\d+)\./)?.[1]).filter(Boolean).map(Number);
  assert.deepEqual(numbered, Array.from({ length: numbered.length }, (_, i) => i + 1));
});

test("Psalm 125 addresses the power of evil, the temptation to imitate it and communal peace", () => {
  const all = study.sections.map((section) => section.body).join("\n").toLowerCase();
  for (const word of ["sião", "jerusalém", "cetro", "justos", "paz", "cristo"]) {
    assert.ok(all.includes(word), "Missing theme " + word);
  }
  assert.ok(study.crossReferences.some((r) => r.startsWith("Romanos 8:35-39")));
  assert.ok(study.crossReferences.some((r) => r.startsWith("Hebreus 11:32-40")));
});

test("Psalm 125 is integrated exactly once in curated catalog", () => {
  assert.match(catalog, /import \{ psalm125Study \} from "\.\/psalm-125-study";/);
  assert.equal((catalog.match(/"biblia-salmos-cap-125": psalm125Study/g) ?? []).length, 1);
});
