import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const catalog = read("src/lib/content/curated-studies.ts");
const bible = JSON.parse(read("src/lib/bible-livre/galatas.json"));
for (const chapter of [5, 6]) {
  test(`Gálatas ${chapter}: leitura integral e exposição versículo por versículo`, () => {
    const study = read(`src/lib/content/galatians-${chapter}-study.ts`);
    const verses = bible.chapters[String(chapter)];
    assert.equal(verses.length, chapter === 5 ? 26 : 18);
    for (let n = 1; n <= verses.length; n++) {
      assert.ok(study.includes(`"id": "exposicao-versiculo-${n}"`), `Exposição ausente: ${chapter}:${n}`);
      assert.ok(study.includes(`**${n}.**`), `Leitura ausente: ${chapter}:${n}`);
      assert.ok(study.includes(`"Gálatas ${chapter}:${n}"`), `Referência ausente: ${chapter}:${n}`);
    }
  });
  test(`Gálatas ${chapter}: catálogo sem duplicações`, () => {
    const key = `"biblia-galatas-cap-${chapter}":`;
    assert.equal(catalog.split(key).length - 1, 1);
    assert.ok(catalog.includes(`import { galatians${chapter}Study } from "./galatians-${chapter}-study";`));
  });
  test(`Gálatas ${chapter}: estrutura editorial com oficina e cautelas`, () => {
    const study = read(`src/lib/content/galatians-${chapter}-study.ts`);
    for (const field of ["historicalContext", "keyPoints", "crossReferences", "questions", "prayer", "sections"]) {
      assert.ok(study.includes(`"${field}"`), field);
    }
    for (const section of ["introducao-contexto", "genero-estrutura", "observacao-versus-inferencia", "questoes-dificeis", "referencias-cruzadas", "cristo-redencao", "perguntas-respostas", "oficina-pregador", "aplicacao-oracao"]) {
      assert.ok(study.includes(section), section);
    }
    assert.ok(study.includes("revisão teológica humana pendente"));
  });
}
