import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const study = readFileSync(resolve(root, "src/lib/content/1-timothy-2-study.ts"), "utf8");
const catalog = readFileSync(resolve(root, "src/lib/content/curated-studies.ts"), "utf8");
const libre = JSON.parse(readFileSync(resolve(root, "src/lib/bible-livre/1-timoteo.json"), "utf8"));
test("1 Timóteo 2: leitura e exposição completas", () => {
  assert.equal(libre.chapters["2"].length, 15);
  for (let verse = 1; verse <= 15; verse++) {
    assert.match(study, new RegExp('\\*\\*' + verse + '\\.\\*\\*'));
    assert.match(study, new RegExp('"id": "versiculo-' + verse + '"'));
    assert.match(study, new RegExp('1 Timóteo 2:' + verse + '(?:"|\\b)'));
  }
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.match(study, /Paráfrase livre original/);
  assert.match(study, /Oficina do pregador/);
  assert.match(study, /Oração final/);
});
test("1 Timóteo 2: registro único no catálogo", () => {
  assert.equal(catalog.split('"biblia-1-timoteo-cap-2"').length - 1, 1);
  assert.equal(catalog.split('import { firstTimothy2Study }').length - 1, 1);
});
