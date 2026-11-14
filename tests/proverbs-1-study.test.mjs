import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = process.cwd();
const study = readFileSync(root + "/src/lib/content/proverbs-1-study.ts", "utf8");
const catalog = readFileSync(root + "/src/lib/content/curated-studies.ts", "utf8");
const bible = JSON.parse(readFileSync(root + "/src/lib/bible-livre/proverbios.json", "utf8"));

test("Provérbios 1: cobertura de versículos do acervo BLIVRE", () => {
  assert.equal(bible.chapters["1"].length, 33);
  const reading = study.match(/"id": "leitura-biblica"[\s\S]*?"id": "introducao"/)?.[0];
  assert.ok(reading, "leitura bíblica integral ausente");
  const verses = [...reading.matchAll(/\\n\\n\*\*(\d+)\.\*\*/g)].map(m => Number(m[1]));
  assert.deepEqual(verses, Array.from({length: 33}, (_, i) => i + 1));
  for (let n = 1; n <= 33; n++) {
    assert.ok(study.includes('"id": "versiculo-' + n + '"'));
    assert.ok(study.includes('"Provérbios 1:' + n + '"'));
  }
});
test("Provérbios 1: catálogo único e seções de formação", () => {
  assert.equal((catalog.match(/"biblia-proverbios-cap-1":/g) ?? []).length, 1);
  assert.match(catalog, /import \{ proverbs1Study \} from "\.\/proverbs-1-study"/);
  for (const section of ["contexto", "estrutura", "termos", "questoes", "referencias", "cristo", "exercicios", "pregador", "oracao"]) {
    assert.ok(study.includes('"id": "' + section + '"'), section);
  }
});
