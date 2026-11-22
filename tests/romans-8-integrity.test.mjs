import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const read = p => readFileSync(new URL(p, root), "utf8");
const source = read("src/lib/content/romans-8-study.ts");
const study = JSON.parse(source.split("= ")[1].replace(/;\s*$/, ""));
const verses = JSON.parse(read("src/lib/bible-livre/romanos.json")).chapters["8"];
const catalog = read("src/lib/content/curated-studies.ts");
test("Romanos 8: todos os 39 versículos em leitura e exposição", () => {
 assert.equal(verses.length, 39);
 const reading = study.sections.find(s => s.id === "leitura-livre-romanos-8");
 assert.match(reading.title, /paráfrase livre original/i);
 assert.match(reading.title, /não é tradução/i);
 for (let i = 1; i <= 39; i++) {
   assert.ok(reading.body.includes("**" + i + "** "), "leitura " + i);
   const section = study.sections.find(s => s.id === "exegese-verso-" + i);
   assert.ok(section?.scriptureRefs.includes("Romanos 8:" + i), "referência " + i);
   assert.ok(section.body.length > 180, "exposição " + i);
 }
});
test("Romanos 8: seções únicas e recursos editoriais", () => {
 const ids = study.sections.map(s => s.id);
 assert.equal(ids.length, new Set(ids).size);
 assert.ok(ids.length >= 50);
 for (const id of ["interpretacao-e-inferencia", "referencias-cruzadas", "perguntas-com-respostas", "oficina-do-pregador", "oracao-final"]) assert.ok(ids.includes(id), id);
 assert.match(source, /revisão editorial humana pendente/i);
});
test("Romanos 8: slug único no catálogo", () => {
 assert.equal((catalog.match(/"biblia-romanos-cap-8"\s*:/g) || []).length, 1);
 assert.equal(catalog.split('import { romans8Study } from "./romans-8-study";').length - 1, 1);
});
