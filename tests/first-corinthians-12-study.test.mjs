import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/first-corinthians-12-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("1 Coríntios 12 — leitura integral e 31 versículos", () => {
  assert.match(study, /Paráfrase livre original/);
  const start = study.indexOf("Leitura bíblica integral");
  const end = study.indexOf("topico-1", start);
  const reading = study.slice(start, end);
  for (let verse = 1; verse <= 31; verse++) {
    assert.ok(reading.includes("**" + verse + "**"), "Falta versículo " + verse);
  }
});
test("1 Coríntios 12 — IDs únicos, conteúdo e registro único", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(x => x[1]);
  assert.ok(ids.length >= 18);
  assert.equal(new Set(ids).size, ids.length);
  for (const term of ["historicalContext", "crossReferences", "questions", "prayer", "Oficina do pregador", "Questões debatidas"]) assert.ok(study.includes(term), term);
  assert.equal((catalog.match(/"biblia-1-corintios-cap-12":/g) || []).length, 1);
  assert.equal(catalog.split("import { firstCorinthians12Study }").length - 1, 1);
});
