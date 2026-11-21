import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/lib/content/john-6-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("João 6: 71 notas de versículos, IDs únicos e elementos editoriais", () => {
 const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size, ids.length);
 for(let n=1;n<=71;n++) assert.equal(ids.filter(id=>id==="versiculo-"+n).length,1);
 for(const marker of ["leitura-integral","contexto-historico","exposicao-paes","exposicao-carne","questoes-interpretativas","referencias-cruzadas","perguntas-respostas","oficina-pregador","oracao-final"]) assert.ok(ids.includes(marker), marker);
 assert.match(source,/Paráfrase explicativa livre original/);
 assert.match(source,/João 6:71/);
 assert.equal((catalog.match(/"biblia-joao-cap-6":/g)||[]).length,1);
 assert.equal((catalog.match(/import \{ john6Study \}/g)||[]).length,1);
});
