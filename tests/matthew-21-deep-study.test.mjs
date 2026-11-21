import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const study = readFileSync(path.join(root, "src/lib/content/matthew-21-study.ts"), "utf8");
const catalog = readFileSync(path.join(root, "src/lib/content/curated-studies.ts"), "utf8");
const verses = JSON.parse(readFileSync(path.join(root, "src/lib/bible-livre/mateus.json"), "utf8")).chapters["21"];

test("Mateus 21: 46 versículos, IDs, referências e catálogo íntegros", () => {
  assert.equal(verses.length, 46);
  assert.match(study, /Paráfrase explicativa livre e análise/);
  assert.match(study, /revisão bíblica humana pendente/);
  for (let i = 1; i <= verses.length; i++) {
    assert.match(study, new RegExp('"id": "versiculo-' + i + '"'));
    assert.match(study, new RegExp('Mateus 21:' + i + '(?![0-9])'));
  }
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, 60);
  assert.equal(ids.length, new Set(ids).size, "IDs de seções únicos");
  for (const topic of ["Contexto", "interpretação", "Referências", "Exercícios", "Oficina", "Oração"]) {
    assert.ok(study.toLowerCase().includes(topic.toLowerCase()), topic);
  }
  assert.equal((catalog.match(/"biblia-mateus-cap-21"\s*:\s*matthew21Study/g) || []).length, 1);
  assert.equal((catalog.match(/import \{ matthew21Study \} from "\.\/matthew-21-study"/g) || []).length, 1);
});
