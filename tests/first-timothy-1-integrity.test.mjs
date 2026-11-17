import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/1-timothy-1-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("1 Timóteo 1: leitura completa e exposição de 20 versículos", () => {
  assert.match(study, /Paráfrase livre original para estudo/);
  for (let i = 1; i <= 20; i++) {
    assert.match(study, new RegExp('\\*\\*' + i + '\\.\\*\\*'));
    assert.match(study, new RegExp('"id": "versiculo-' + i + '"'));
  }
  for (const id of ["contexto","estrutura","interpretacao-inferencia","referencias","cuidados","perguntas-respostas","oficina","oracao"]) assert.ok(study.includes('"id": "' + id + '"'), id);
});
test("1 Timóteo 1: registro único no catálogo", () => {
  assert.equal((catalog.match(/import \\{ firstTimothy1Study \\} from "\\.\\/1-timothy-1-study";/g) ?? []).length, 1);
  assert.equal((catalog.match(/"biblia-1-timoteo-cap-1": firstTimothy1Study/g) ?? []).length, 1);
});
