import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");
const source = read("src/lib/content/acts-19-study.ts");
const catalog = read("src/lib/content/curated-studies.ts");
const verses = JSON.parse(read("src/lib/bible-livre/atos.json")).chapters["19"];
test("Atos 19: 41 versículos em paráfrase original", () => {
 assert.equal(verses.length,41);
 const reading=source.match(/"id": "leitura-livre-atos-19"[\s\S]*?(?=\n    \{\n      "id": "introducao-objetivos")/);
 assert.ok(reading,"bloco de leitura");
 for(let i=1;i<=verses.length;i++) assert.ok(reading[0].includes("**"+i+"** "), "versículo "+i);
 assert.match(reading[0],/Paráfrase livre original/);
});
test("Atos 19: notas e IDs sem repetição", () => {
 const ids=[...source.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(let i=1;i<=41;i++) { assert.ok(ids.includes("exegese-verso-"+i)); assert.ok(source.includes("Atos 19:"+i)); }
});
test("Atos 19: perícopes, cuidado interpretativo e oficina", () => {
 for(const marker of ["pericope-1-7","pericope-8-10","pericope-11-20","pericope-21-22","pericope-23-34","pericope-35-41","termos-interpretacoes","oficina-pregador","perguntas-respostas","oracao-final","Ártemis","exorcistas","violência"]) assert.ok(source.includes(marker),marker);
});
test("Atos 19: registro único no catálogo", () => {
 assert.equal((catalog.match(/"biblia-atos-cap-19"\s*:/g)||[]).length,1);
 assert.equal((catalog.match(/import \{ acts19Study \} from "\.\/acts-19-study";/g)||[]).length,1);
});