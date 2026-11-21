import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");
const source = read("src/lib/content/acts-18-study.ts");
const catalog = read("src/lib/content/curated-studies.ts");
const verses = JSON.parse(read("src/lib/bible-livre/atos.json")).chapters["18"];
test("Atos 18: acervo e paráfrase numerada completos", () => {
 assert.equal(verses.length,28);
 const reading = source.match(/"id": "leitura-livre-atos-18"[\s\S]*?(?=\n    \{\n      "id": "introducao-objetivos")/);
 assert.ok(reading,"bloco de leitura");
 for(let i=1;i<=verses.length;i++) assert.ok(reading[0].includes("**"+i+"** "), "falta versículo "+i);
 assert.match(reading[0],/Paráfrase livre original/);
});
test("Atos 18: 28 notas exegéticas e IDs sem repetição", () => {
 const ids=[...source.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(let i=1;i<=28;i++) {
   assert.ok(ids.includes("exegese-verso-"+i));
   assert.ok(source.includes("Atos 18:"+i));
 }
});
test("Atos 18: perícopes, questões sensíveis e oficina", () => {
 for(const marker of ["pericope-1-5","pericope-6-8","pericope-9-11","pericope-12-17","pericope-18-23","pericope-24-28","termos-interpretacoes","oficina-pregador","perguntas-respostas","oracao-final","antissemitismo","Sóstenes","Priscila"]) assert.ok(source.includes(marker),marker);
});
test("Atos 18: registro único no catálogo", () => {
 assert.equal((catalog.match(/"biblia-atos-cap-18"\s*:/g)||[]).length,1);
 assert.equal((catalog.match(/import \{ acts18Study \} from "\.\/acts-18-study";/g)||[]).length,1);
});
