import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Salmos 148: leitura completa, comentários e catálogo", () => {
  const source = fs.readFileSync("src/lib/content/psalm-148-study.ts", "utf8");
  const catalog = fs.readFileSync("src/lib/content/curated-studies.ts", "utf8");
  const bible = JSON.parse(fs.readFileSync("src/lib/bible-livre/salmos.json", "utf8"));
  const count = bible.chapters["148"].length;
  assert.equal(count, 14);
  assert.match(source, /Paráfrase livre para estudo, não tradução oficial/);
  assert.equal((source.match(/"id": "versiculo-\d+"/g) || []).length, count);
  for (let verse = 1; verse <= count; verse++) {
    assert.ok(source.includes(`"id": "versiculo-${verse}"`));
    assert.ok(source.includes(`"Salmos 148:${verse}"`));
    assert.ok(source.includes(`**${verse}.**`));
  }
  assert.match(catalog, /"biblia-salmos-cap-148": psalm148Study/);
  assert.match(catalog, /import \{ psalm148Study \} from "\.\/psalm-148-study";/);
  for (const title of ["Contexto histórico", "Questões interpretativas", "Exercícios", "Oficina do pregador", "Cristo e a história"]) assert.ok(source.includes(title), title);
});
