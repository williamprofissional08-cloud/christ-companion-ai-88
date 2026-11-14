import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
for (const n of [140, 141, 142]) {
  test(`Psalm ${n}: catalog and verse coverage`, () => {
    const catalog = readFileSync("src/lib/content/curated-studies.ts", "utf8");
    const study = readFileSync(`src/lib/content/psalm-${n}-study.ts`, "utf8");
    const bible = JSON.parse(readFileSync("src/lib/bible-livre/salmos.json", "utf8"));
    const count = bible.chapters[String(n)].length;
    assert.ok(catalog.includes(`"biblia-salmos-cap-${n}": psalm${n}Study`));
    assert.ok(catalog.includes(`import { psalm${n}Study } from "./psalm-${n}-study"`));
    assert.ok(study.includes('"depth": "deep"'));
    assert.ok(study.includes('"id": "leitura-biblica"'));
    assert.ok(study.includes("Paráfrase livre de estudo, não tradução"));
    for (let i = 1; i <= count; i++) {
      assert.ok(study.includes(`"id": "versiculo-${i}"`), `missing verse ${i}`);
    }
    assert.ok(!study.includes(`"id": "versiculo-${count+1}"`));
    for (const field of ["historicalContext", "crossReferences", "questions", "prayer", "application"]) assert.ok(study.includes(`"${field}"`));
  });
}
