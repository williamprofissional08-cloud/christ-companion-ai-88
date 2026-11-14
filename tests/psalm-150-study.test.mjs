import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Salmos 150 — seis versículos, estrutura e integração", () => {
  const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/salmos.json", "utf8"));
  const source = fs.readFileSync("src/lib/content/psalm-150-study.ts", "utf8");
  const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
  const verses = bible.chapters["150"];
  assert.equal(verses.length, 6);
  const reading = source.match(/"id": "leitura-biblica"[\\s\\S]*?"id": "introducao"/);
  assert.ok(reading, "paráfrase e introdução presentes");
  for (let n = 1; n <= verses.length; n++) {
    assert.match(source, new RegExp('"id": "versiculo-' + n + '"'));
    assert.match(source, new RegExp('Salmos 150:' + n + '"'));
    assert.match(source, new RegExp('\\\\*\\\\*' + n + '\\\\.'));
  }
  assert.match(source, /Paráfrase livre para estudo/);
  assert.match(source, /Oficina do pregador/);
  assert.match(source, /Exercícios e respostas/);
  assert.equal((catalog.match(/"biblia-salmos-cap-150":/g) ?? []).length, 1);
  assert.equal((catalog.match(/import \\{ psalm150Study \\}/g) ?? []).length, 1);
});
