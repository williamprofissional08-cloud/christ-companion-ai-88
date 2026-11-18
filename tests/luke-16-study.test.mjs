import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const study = fs.readFileSync("src/lib/content/luke-16-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));
test("Lucas 16: todos os versículos e notas únicas", () => {
  const verses = bible.chapters["16"];
  assert.equal(verses.length, 31);
  const ids = [...study.matchAll(/"id": "versiculo-(\\d+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(ids, Array.from({length: verses.length}, (_, i) => i + 1));
  const allIds = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(allIds).size, allIds.length);
  for (const n of ids) assert.match(study, new RegExp('"Lucas 16:' + n + '"'));
  assert.match(study, /Paráfrase explicativa livre original/);
  for (const id of ["pericopes","interpretacao","referencias","aplicacao","perguntas","oficina","oracao"]) assert.ok(allIds.includes(id));
});
test("Lucas 16: registro único no catálogo", () => {
  assert.equal((catalog.match(/"biblia-lucas-cap-16"\\s*:/g) ?? []).length, 1);
  assert.equal((catalog.match(/import \\{ luke16Study \\} from/g) ?? []).length, 1);
});
