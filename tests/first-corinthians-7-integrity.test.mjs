import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/first-corinthians-7-study.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/1-corintios.json", import.meta.url), "utf8"));
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const verses = bible.chapters["7"];
test("1 Coríntios 7: acervo BLIVRE e paráfrase integral", () => {
 assert.equal(verses.length,40);
 for (let n=1;n<=verses.length;n++) {
  assert.ok(study.includes(`**${n}.**`), `Paráfrase do versículo ${n}`);
  assert.ok(study.includes(`"id": "versiculo-${n}"`), `Exposição do versículo ${n}`);
  assert.ok(study.includes(`1 Coríntios 7:${n}`), `Referência do versículo ${n}`);
 }
 assert.match(study,/paráfrase livre original/);
 assert.match(study,/não tradução oficial/);
});
test("1 Coríntios 7: temas sensíveis e formação do pregador",()=>{
 for(const term of ["consentimento","escravidão","abuso","necessidade presente","oficina-pregador","perguntas-respostas","oracao-final","questoes-interpretativas"]) assert.ok(study.includes(term),term);
 const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 assert.ok(ids.length>=50);
});
test("1 Coríntios 7: catálogo possui mapeamento único",()=>{
 assert.equal((catalog.match(/"biblia-1-corintios-cap-7": firstCorinthians7Study/g)||[]).length,1);
 assert.equal((catalog.match(/import \{ firstCorinthians7Study \} from "\.\/first-corinthians-7-study";/g)||[]).length,1);
});
