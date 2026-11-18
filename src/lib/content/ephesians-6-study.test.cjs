const fs = require("node:fs");
const assert = require("node:assert/strict");
const path = require("node:path");
const root = path.resolve(__dirname, "../../..");
const study = fs.readFileSync(path.join(__dirname, "ephesians-6-study.ts"), "utf8");
const catalog = fs.readFileSync(path.join(__dirname, "curated-studies.ts"), "utf8");
const bible = JSON.parse(fs.readFileSync(path.join(root, "src/lib/bible-livre/efesios.json"), "utf8"));
const count = bible.chapters["6"].length;
assert.equal(count, 24);
assert.match(study, /Paráfrase livre original/);
const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, "IDs duplicados");
for (let n=1;n<=count;n++) {
  assert.ok(ids.includes("versiculo-"+n), "Falta exposição do versículo "+n);
  assert.match(study, new RegExp("\\\\*\\\\*"+n+"\\\\.\\\\*\\\\*"), "Falta paráfrase do versículo "+n);
}
assert.equal((catalog.match(/import \\{ ephesians6Study \\} from "\\.\\/ephesians-6-study";/g)||[]).length, 1);
assert.equal((catalog.match(/"biblia-efesios-cap-6": ephesians6Study/g)||[]).length, 1);
console.log("Efésios 6: integridade estrutural e registro únicos OK");
