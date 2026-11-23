import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source=readFileSync(new URL("../src/lib/content/john-7-study.ts",import.meta.url),"utf8");
const catalog=readFileSync(new URL("../src/lib/content/curated-studies.ts",import.meta.url),"utf8");
const bible=JSON.parse(readFileSync(new URL("../src/lib/bible-livre/joao.json",import.meta.url),"utf8"));
test("João 7: 53 versículos BLIVRE e 53 notas únicas",()=>{
 const count=bible.chapters["7"].length; assert.equal(count,53);
 const ids=[...source.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(let n=1;n<=count;n++){assert.equal(ids.filter(x=>x==="versiculo-"+n).length,1);assert.ok(source.includes('"João 7:'+String(n)+'"'));}
 for(const marker of ["leitura-integral","contexto-historico","festa-e-tempo","ensino-e-justica","origem-e-partida","agua-viva","divisao-messianica","guardas-nicodemos","questoes-interpretativas","referencias-cruzadas","perguntas-respostas","oficina-pregador","oracao-final"])assert.ok(ids.includes(marker),marker);
 assert.match(source,/Paráfrase explicativa livre original/);
 assert.equal((catalog.match(/"biblia-joao-cap-7":/g)||[]).length,1);
 assert.equal((catalog.match(/import \{ john7Study \}/g)||[]).length,1);
});
