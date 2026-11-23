import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const study = readFileSync(new URL("src/lib/content/first-corinthians-4-study.ts", root), "utf8");
const catalog = readFileSync(new URL("src/lib/content/curated-studies.ts", root), "utf8");
const bible = JSON.parse(readFileSync(new URL("src/lib/bible-livre/1-corintios.json", root), "utf8"));
test("1 Coríntios 4 — 21 versículos e paráfrase integral", () => {
 const count = bible.chapters["4"].length;
 assert.equal(count, 21);
 const scripture = study.split('"id": "leitura-integral"')[1]?.split('"id": "introducao"')[0] ?? "";
 for (let i=1;i<=count;i++) assert.ok(scripture.includes("**"+i+".**"),"versículo "+i);
});
test("1 Coríntios 4 — integridade editorial e catálogo único", () => {
 const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length, 40);
 assert.equal(new Set(ids).size, ids.length);
 for (const id of ["leitura-integral","contexto-historico","questoes-interpretativas","referencias","aplicacao","perguntas","oficina","oracao"]) assert.ok(ids.includes(id),id);
 for(let i=1;i<=21;i++) assert.ok(ids.includes("exposicao-versiculo-"+i));
 assert.equal(catalog.split('"biblia-1-corintios-cap-4":').length-1,1);
 assert.equal(catalog.split("import { firstCorinthians4Study }").length-1,1);
});
