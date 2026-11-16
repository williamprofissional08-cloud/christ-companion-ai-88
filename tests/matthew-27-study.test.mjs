import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const studySource = readFileSync(new URL("../src/lib/content/matthew-27-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/mateus.json", import.meta.url), "utf8"));
const match = studySource.match(/export const matthew27Study: StudyContent = (\{[\s\S]*\});/);
assert.ok(match, "export de Mateus 27 presente");
const study = JSON.parse(match[1]);

test("Mateus 27: 66 versículos reais e cobertura exegética individual", () => {
  const verses = bible.chapters["27"];
  assert.equal(verses.length, 66);
  assert.equal(study.depth, "deep");
  const notes = study.sections.filter((section) => /^versiculo-\d+$/.test(section.id));
  assert.equal(notes.length, verses.length);
  for (let i = 0; i < verses.length; i++) {
    assert.ok(verses[i].trim(), `versículo ${i + 1} no acervo`);
    assert.equal(notes[i].id, `versiculo-${i + 1}`);
    assert.deepEqual(notes[i].scriptureRefs, [`Mateus 27:${i + 1}`]);
    assert.ok(notes[i].body.length > 90, `análise do versículo ${i + 1}`);
  }
  assert.equal(new Set(study.sections.map((section) => section.id)).size, study.sections.length);
});

test("Mateus 27: integração única, navegação e seções editoriais", () => {
  assert.equal((catalog.match(/import \{ matthew27Study \} from "\.\/matthew-27-study";/g) ?? []).length, 1);
  assert.equal((catalog.match(/"biblia-mateus-cap-27": matthew27Study,/g) ?? []).length, 1);
  for (const id of ["leitura", "contexto", "estrutura", "termos", "questoes", "referencias", "teologia", "discernimento", "sensivel", "aplicacao", "resumo", "exercicios", "pregacao", "oracao"]) {
    assert.ok(study.sections.some((section) => section.id === id), `seção ${id}`);
  }
  assert.match(study.sections.find((section) => section.id === "leitura").body, /paráfrases explicativas livres/i);
  assert.ok(study.crossReferences.length >= 8);
});
