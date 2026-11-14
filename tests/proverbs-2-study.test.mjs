import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const study = readFileSync(new URL("../src/lib/content/proverbs-2-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/proverbios.json", import.meta.url), "utf8"));

test("Provérbios 2: acervo, exposição e integração", () => {
  const count = bible.chapters["2"].length;
  assert.equal(count, 22);
  assert.match(study, /Paráfrase livre para estudo, não tradução bíblica oficial/);
  const reading = study.match(/"id": "leitura-biblica"[\s\S]*?"id": "introducao"/)?.[0] ?? "";
  for (let verse = 1; verse <= count; verse++) {
    assert.ok(reading.includes(`**${verse}.**`), `Leitura ausente: versículo ${verse}`);
    assert.ok(study.includes(`"id": "versiculo-${verse}"`), `Exposição ausente: versículo ${verse}`);
  }
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size, "IDs de seção duplicados");
  for (const id of ["contexto", "estrutura", "pericopes", "interpretacoes", "referencias", "cristo", "exercicios", "pregador", "oracao"]) {
    assert.ok(ids.includes(id), `Seção ausente: ${id}`);
  }
  assert.match(catalog, /import \{ proverbs2Study \} from "\.\/proverbs-2-study";/);
  assert.match(catalog, /"biblia-proverbios-cap-2": proverbs2Study/);
});
