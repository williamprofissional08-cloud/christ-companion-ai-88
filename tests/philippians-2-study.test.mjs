import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/philippians-2-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/filipenses.json", import.meta.url), "utf8"));
test("Filipenses 2: todos os versículos BLIVRE recebem leitura e exposição", () => {
 const total = bible.chapters["2"].length;
 assert.equal(total, 30);
 for(let n=1;n<=total;n++){
   assert.match(study,new RegExp('"id": "versiculo-'+n+'"'));
   assert.match(study,new RegExp('Filipenses 2:'+n+'(?![0-9])'));
 }
 assert.equal((study.match(/"id": "versiculo-\\d+"/g)||[]).length,total);
 assert.equal((study.match(/\\*\\*Paráfrase livre original:/g)||[]).length,total);
 assert.equal((study.match(/\\*\\*Exposição contextual:/g)||[]).length,total);
});
test("Filipenses 2: identidade e catálogo únicos",()=>{
 assert.equal((catalog.match(/import \\{ philippians2Study \\} from/g)||[]).length,1);
 assert.equal((catalog.match(/"biblia-filipenses-cap-2": philippians2Study/g)||[]).length,1);
 assert.match(study,/oficina-pregador/);
 assert.match(study,/interpretacao-e-inferencia/);
 assert.match(study,/perguntas-respostas/);
});
