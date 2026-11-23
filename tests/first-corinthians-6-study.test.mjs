import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const source = readFileSync(new URL("../src/lib/content/first-corinthians-6-study.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/1-corintios.json", import.meta.url), "utf8"));
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("1 Coríntios 6: 20 versículos, sem omissões", () => {
 assert.equal(bible.chapters["6"].length, 20);
 const reading = source.slice(source.indexOf("Leitura integral"), source.indexOf("Contexto literário"));
 for(let n=1;n<=20;n++) assert.match(reading, new RegExp("\\*\\*"+n+"\\.\\*\\*"));
});
test("1 Coríntios 6: seções e registro únicos", () => {
 const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(x=>x[1]);
 assert.equal(ids.length,35);
 assert.equal(new Set(ids).size,ids.length);
 assert.equal((catalog.match(/"biblia-1-corintios-cap-6":/g)||[]).length,1);
 assert.equal((catalog.match(/import \{ firstCorinthians6Study \}/g)||[]).length,1);
});
test("1 Coríntios 6: recursos editoriais",()=>{
 for(const word of ["paráfrase livre original","Questões debatidas","Exercícios com respostas","Oficina do pregador","Oração final","Cristo, ressurreição"])assert.ok(source.includes(word),word);
});
