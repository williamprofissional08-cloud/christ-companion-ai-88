import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const study = readFileSync(resolve(root,"src/lib/content/ephesians-1-study.ts"),"utf8");
const catalog = readFileSync(resolve(root,"src/lib/content/curated-studies.ts"),"utf8");
const bible = JSON.parse(readFileSync(resolve(root,"src/lib/bible-livre/efesios.json"),"utf8"));
assert.equal(bible.chapters["1"].length,23,"Capítulo bíblico deve ter 23 versículos");
for(let n=1;n<=23;n++) {
  assert.match(study,new RegExp('\\*\\*'+n+'\\.\\*\\*'),"Paráfrase ausente: "+n);
  assert.ok(study.includes('"id": "versiculo-'+n+'"'),"Exposição ausente: "+n);
}
const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,"IDs duplicados");
assert.ok(ids.length>=30,"Estudo insuficientemente estruturado");
assert.equal((catalog.match(/"biblia-efesios-cap-1"\\s*:/g)||[]).length,1,"Slug deve ocorrer uma vez");
assert.equal((catalog.match(/import \\{ ephesians1Study \\} from "\\.\\/ephesians-1-study";/g)||[]).length,1,"Importação deve ocorrer uma vez");
console.log("Efésios 1: 23 versículos, exposições, IDs e catálogo verificados");
