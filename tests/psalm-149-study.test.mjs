import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const study = readFileSync(new URL("../src/lib/content/psalm-149-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/salmos.json", import.meta.url), "utf8"));

test("Salmos 149: acervo, paráfrase e exposição dos nove versículos", () => {
  assert.equal(bible.chapters["149"].length, 9);
  assert.match(study, /Paráfrase livre de estudo/);
  for (let verse = 1; verse <= 9; verse++) {
    assert.ok(study.includes(`**${verse}.**`), `Paráfrase do verso ${verse} ausente`);
    assert.ok(study.includes(`"id": "versiculo-${verse}"`), `Exposição do verso ${verse} ausente`);
  }
});

test("Salmos 149: catálogo integra exatamente uma vez", () => {
  assert.equal((catalog.match(/"biblia-salmos-cap-149": psalm149Study/g) || []).length, 1);
  assert.equal((catalog.match(/import \{ psalm149Study \} from "\.\/psalm-149-study";/g) || []).length, 1);
});

test("Salmos 149: inclui interpretação da violência, exercícios e pregação", () => {
  assert.match(study, /vingança/);
  assert.match(study, /Exercícios com respostas orientadoras/);
  assert.match(study, /Oficina do pregador/);
});
