import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const filename = new URL("../src/lib/content/psalm-122-study.ts", import.meta.url);
const source = readFileSync(filename, "utf8");
const start = source.indexOf(" = {\n");
const end = source.lastIndexOf(";\n");
assert.ok(start >= 0 && end > start, "Psalm 122 must have a static study object");
const study = JSON.parse(source.slice(start + 3, end));
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");

test("Psalm 122 has a chapter-specific, deep and complete reading", () => {
  assert.equal(study.version, 5);
  assert.equal(study.depth, "deep");
  assert.ok(study.sections.length >= 26);
  assert.ok(study.keyPoints.length >= 8);
  assert.ok(study.crossReferences.length >= 12);
  assert.ok(study.questions.length >= 15);
  for (const [name, minimum] of Object.entries({
    intro: 1200,
    historicalContext: 900,
    application: 1000,
    conclusion: 500,
    prayer: 100,
  })) {
    assert.ok(study[name].length >= minimum, name + " is below the editorial depth minimum");
  }

  const ids = study.sections.map((section) => section.id);
  assert.equal(new Set(ids).size, ids.length, "Section ids must be unique");
  assert.ok(study.sections.every((section) => section.body.length >= 500));
  const reading = study.sections.find((section) => section.id === "leitura-biblica");
  assert.ok(reading && reading.body.includes("Paráfrase livre"));
  for (let verse = 1; verse <= 9; verse++) {
    assert.ok(reading.body.includes("**" + verse + "**"), "Missing Psalm 122 verse " + verse);
  }
});

test("Psalm 122 is available in the curated studies catalog", () => {
  assert.match(catalog, /from "\.\/psalm-122-study"/);
  assert.match(catalog, /"biblia-salmos-cap-122": psalm122Study/);
});
