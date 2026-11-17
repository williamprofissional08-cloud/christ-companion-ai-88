import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/lib/content/second-thessalonians-3-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("2 Tessalonicenses 3: cobertura e registro", () => {
  assert.match(source, /secondThessalonians3Study: StudyContent/);
  assert.match(source, /Paráfrase livre original/);
  const reading = source.split('"id": "leitura-integral"')[1]?.split('"id": "introducao"')[0] ?? "";
  for (let i = 1; i <= 18; i++) assert.ok(reading.includes("**" + i + ".**"), "Versículo " + i);
  const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 18);
  assert.equal((catalog.match(/"biblia-2-tessalonicenses-cap-3":/g) ?? []).length, 1);
  assert.equal((catalog.match(/import \{ secondThessalonians3Study \}/g) ?? []).length, 1);
});
