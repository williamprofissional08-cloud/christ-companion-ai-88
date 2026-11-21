import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");
const source = read("src/lib/content/acts-20-study.ts");
const catalog = read("src/lib/content/curated-studies.ts");
const verses = JSON.parse(read("src/lib/bible-livre/atos.json")).chapters["20"];
test("Atos 20: leitura original e 38 versículos", () => {
 assert.equal(verses.length,38);
 const reading=source.match(/"id": "leitura-livre-atos-20"[\s\S]*?(?=\n    \{\n      "id": "introducao-objetivos")/);
 assert.ok(reading);
 for(let i=1;i<=verses.length;i++) assert.ok(reading[0].includes("**"+i+"** "), "versículo "+i);
 assert.match(reading[0],/Paráfrase livre original/);
});
test("Atos 20: comentário individual, IDs únicos",()=>{
 const ids=[...source.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(let i=1;i<=38;i++){assert.ok(ids.includes("exegese-verso-"+i));assert.ok(source.includes("Atos 20:"+i));}
});
test("Atos 20: perícopes, questões sensíveis e oficina",()=>{
 for(const marker of ["pericope-1-6","pericope-7-12","pericope-13-16","pericope-17-21","pericope-22-27","pericope-28-32","pericope-33-35","pericope-36-38","termos-interpretacoes","perguntas-respostas","oficina-pregador","oracao-final","antijudaicas","variante","Êutico"]) assert.ok(source.includes(marker),marker);
});
test("Atos 20: registro único no catálogo",()=>{
 assert.equal((catalog.match(/"biblia-atos-cap-20"\s*:/g)||[]).length,1);
 assert.equal((catalog.match(/import \{ acts20Study \} from "\.\\/acts-20-study";/g)||[]).length,1);
});
