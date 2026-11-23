import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const study = fs.readFileSync("src/lib/content/luke-24-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/lucas.json", "utf8"));

test("Lucas 24: cobertura integral de 53 versículos", () => {
  const total = bible.chapters["24"].length;
  assert.equal(total, 53);
  const ids = [...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(ids, Array.from({ length: total }, (_, i) => i + 1));
  assert.equal((study.match(/Paráfrase explicativa livre original \(não é citação bíblica\)/g) || []).length, total);
});

test("Lucas 24: IDs estáveis e assuntos editoriais", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 69);
  assert.equal(new Set(ids).size, 69);
  for (const term of ["Emaús", "ressurreição", "variante", "Oficina do pregador", "arrependimento"]) {
    assert.ok(study.toLowerCase().includes(term.toLowerCase()), term);
  }
});

test("Lucas 24: import e slug únicos", () => {
  assert.equal((catalog.match(/import \{ luke24Study \} from "\.\/luke-24-study";/g) || []).length, 1);
  assert.equal((catalog.match(/"biblia-lucas-cap-24": luke24Study/g) || []).length, 1);
});
