import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const study = fs.readFileSync("src/lib/content/matthew-26-study.ts", "utf8");
const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/mateus.json", "utf8"));
test("Mateus 26 confere acervo e cada versículo", () => {
  assert.equal(bible.chapters["26"].length, 75);
  const verses = [...study.matchAll(/"id": "versiculo-(\d+)"/g)].map(m => Number(m[1]));
  assert.deepEqual(verses, Array.from({length: 75}, (_, i) => i + 1));
  for (let i = 1; i <= 75; i++) assert.ok(study.includes('"Mateus 26:' + i + '"'));
});
test("Mateus 26 tem seções e campos editoriais essenciais", () => {
  for (const id of ["leitura","contexto","estrutura","termos","cruzadas","debates","distincoes","cristo","aplicacao","exercicios","pregacao","oracao"]) {
    assert.ok(study.includes('"id": "' + id + '"'), id);
  }
  assert.ok(study.includes("Paráfrase explicativa livre"));
  assert.ok(study.includes("respostas orientadoras"));
  assert.ok(study.includes("revisão bíblica humana pendente"));
});
test("Mateus 26 tem import e slug únicos", () => {
  assert.equal(catalog.match(/import \{ matthew26Study \} from "\.\/matthew-26-study";/g)?.length, 1);
  assert.equal(catalog.match(/"biblia-mateus-cap-26": matthew26Study/g)?.length, 1);
});
