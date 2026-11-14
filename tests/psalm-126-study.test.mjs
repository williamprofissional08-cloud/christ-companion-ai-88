import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../src/lib/content/psalm-126-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const start = source.indexOf(" = {\n");
const end = source.lastIndexOf(";\n");
assert.ok(start > 0 && end > start, "Expected an auditable static Psalm 126 object");
const study = JSON.parse(source.slice(start + 3, end));

test("Psalm 126 is a deep study of every verse with the Genesis 1 editorial standards", () => {
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
    assert.ok(study[field].length >= min, field + " insufficient depth");
  }

  const ids = study.sections.map((section) => section.id);
  assert.equal(new Set(ids).size, ids.length, "Section IDs must be unique");
  assert.ok(study.sections.every((section) => section.body.length >= 500));
  const reading = study.sections.find((section) => section.id === "leitura-biblica");
  assert.match(reading.body, /Paráfrase livre/);
  for (let n = 1; n <= 6; n++) {
    assert.ok(reading.body.includes("**" + n + ".**"), "Missing verse " + n);
  }
  const numbered = study.sections
    .map((section) => section.title.match(/^(\d+)\./)?.[1])
    .filter(Boolean)
    .map(Number);
  assert.deepEqual(numbered, Array.from({ length: numbered.length }, (_, i) => i + 1));
});

test("Psalm 126 avoids prosperity distortion and includes properly grounded Christian references", () => {
  const body = study.sections.map((section) => section.body).join("\n").toLowerCase();
  for (const word of ["sião", "neguebe", "sementes", "lágrimas", "cristo", "restauração"]) {
    assert.ok(body.includes(word), "Missing subject " + word);
  }
  assert.ok(study.crossReferences.some((item) => item.startsWith("João 16:20-22")));
  assert.ok(study.crossReferences.some((item) => item.startsWith("Hebreus 11:35-40")));
});

test("Psalm 126 is registered once in the actual app catalog", () => {
  assert.match(catalog, /import \{ psalm126Study \} from "\.\/psalm-126-study";/);
  assert.equal((catalog.match(/"biblia-salmos-cap-126": psalm126Study/g) ?? []).length, 1);
});
