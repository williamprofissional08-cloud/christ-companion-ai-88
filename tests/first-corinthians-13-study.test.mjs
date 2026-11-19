import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const study = readFileSync(new URL("src/lib/content/first-corinthians-13-study.ts", root), "utf8");
const catalog = readFileSync(new URL("src/lib/content/curated-studies.ts", root), "utf8");
const verses = JSON.parse(readFileSync(new URL("src/lib/bible-livre/1-corintios.json", root), "utf8")).chapters["13"];
test("1 Coríntios 13: todos os versículos BLIVRE têm paráfrase e exposição", () => {
  assert.equal(verses.length, 13);
  for (let n = 1; n <= verses.length; n++) {
    const start = study.indexOf('"id": "versiculo-' + n + '"');
    assert.ok(start >= 0, "versículo ausente " + n);
    const end = study.indexOf('"id": "versiculo-' + (n + 1) + '"', start + 1);
    const section = study.slice(start, end < 0 ? study.indexOf('"id": "pericope-1"', start) : end);
    assert.ok(section.includes("Paráfrase livre original:"));
    assert.ok(section.includes("Exposição contextual:"));
    assert.ok(section.includes("1 Coríntios 13:" + n));
  }
});
test("1 Coríntios 13: IDs únicos e estrutura pastoral", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.ok(ids.length >= 22);
  for (const word of ["pericope-1","pericope-4","interpretacao-e-inferencia","referencias-comentadas","oficina-do-pregador","oracao-e-sintese","abuso"]) assert.ok(study.includes(word), word);
});
test("1 Coríntios 13: catálogo com slug e import únicos", () => {
  assert.equal((catalog.match(/"biblia-1-corintios-cap-13": firstCorinthians13Study/g) || []).length, 1);
  assert.equal((catalog.match(/import \{ firstCorinthians13Study \} from "\.\/first-corinthians-13-study";/g) || []).length, 1);
});
