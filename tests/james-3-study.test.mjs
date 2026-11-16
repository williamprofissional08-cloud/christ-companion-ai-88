import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/james-3-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/tiago.json", import.meta.url), "utf8"));
test("Tiago 3: cobertura integral", () => { const verses=bible.chapters["3"]; assert.equal(verses.length,18); for(let i=1;i<=18;i++){assert.match(study,new RegExp('"id": "versiculo-'+i+'"'));assert.match(study,new RegExp('\\\\n\\\\n'+i+'\\\\. '));} });
test("Tiago 3: catálogo único",()=>{assert.equal((catalog.match(/import \\{ james3Study \\} from "\\.\\/james-3-study";/g)||[]).length,1);assert.equal((catalog.match(/"biblia-tiago-cap-3": james3Study/g)||[]).length,1);});
test("Tiago 3: seções únicas",()=>{const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);for(const id of ["contexto","pericopes","termos","referencias","cuidados","aplicacao","exercicios","pregador","oracao"])assert.ok(ids.includes(id));});
