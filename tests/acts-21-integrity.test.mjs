import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");
const source = read("src/lib/content/acts-21-study.ts");
const catalog = read("src/lib/content/curated-studies.ts");
const verses = JSON.parse(read("src/lib/bible-livre/atos.json")).chapters["21"];
test("Atos 21: leitura livre original cobre todos os versículos", () => {
 assert.equal(verses.length, 40);
 const reading = [source.split('"id": "leitura-livre-atos-21"')[1]?.split('"id": "introducao-objetivos"')[0]];
 assert.ok(reading[0]);
 assert.match(reading[0], /Paráfrase livre original/);
 for(let i=1;i<=verses.length;i++) assert.ok(reading[0].includes("**"+i+"** "), "versículo "+i);
});
test("Atos 21: exposições e IDs íntegros", () => {
 const ids=[...source.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(let i=1;i<=40;i++){assert.ok(ids.includes("exegese-verso-"+i));assert.ok(source.includes("Atos 21:"+i));}
});
test("Atos 21: perícopes e temas editoriais", () => {
 for(const marker of ["pericope-1-6","pericope-7-14","pericope-15-19","pericope-20-26","pericope-27-36","pericope-37-40","termos-interpretacoes","perguntas-respostas","oficina-pregador","oracao-final","Trófimo","Ágabo","antijudaicas"]) assert.ok(source.includes(marker),marker);
});
test("Atos 21: import e slug únicos",()=>{
 assert.equal((catalog.match(/"biblia-atos-cap-21"\s*:/g)||[]).length,1);
 assert.equal(catalog.split('import { acts21Study } from "./acts-21-study";').length-1,1);
});
