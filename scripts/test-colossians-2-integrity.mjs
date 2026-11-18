import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const study = readFileSync(new URL("../src/lib/content/colossians-2-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/colossenses.json", import.meta.url), "utf8"));
const expected = bible.chapters["2"].length;
assert.equal(expected, 23, "BLIVRE: total de versículos inesperado");
const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, "IDs duplicados");
assert.ok(ids.includes("leitura-integral"));
for (let v=1; v<=expected; v++) {
 assert.ok(ids.includes(`versiculo-${v}`), `Falta comentário de versículo ${v}`);
 assert.ok(study.includes(`**${v}.**`), `Falta paráfrase do versículo ${v}`);
}
for(const id of ["contexto","estrutura","interpretacao","referencias","cuidado","aplicacao","perguntas","oficina","glossario"]) assert.ok(ids.includes(id), `Falta seção ${id}`);
assert.equal((catalog.match(/import \{ colossians2Study \} from "\.\/colossians-2-study";/g)||[]).length,1);
assert.equal((catalog.match(/"biblia-colossenses-cap-2": colossians2Study/g)||[]).length,1);
console.log(`Colossenses 2: ${expected} versículos, ${ids.length} seções e registro único verificados.`);
