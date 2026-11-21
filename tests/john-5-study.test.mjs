import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/lib/content/john-5-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("João 5: 47 notas de versículos, IDs únicos e elementos editoriais", () => {
 const ids = [...source.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size, ids.length);
 for(let n=1;n<=47;n++) assert.equal(ids.filter(id=>id==="versiculo-"+n).length,1);
 for(const marker of ["leitura-integral","questao-textual","questao-doenca","referencias-cruzadas","perguntas-respostas","oficina-pregador","oracao-final"]) assert.ok(ids.includes(marker), marker);
 assert.match(source,/Paráfrase explicativa livre original/);
 assert.match(source,/João 5:3b/);
 assert.equal((catalog.match(/"biblia-joao-cap-5":/g)||[]).length,1);
 assert.equal((catalog.match(/import \{ john5Study \}/g)||[]).length,1);
});
