import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const study = readFileSync(new URL("../src/lib/content/ephesians-5-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const bible = JSON.parse(readFileSync(new URL("../src/lib/bible-livre/efesios.json", import.meta.url), "utf8"));
test("Efésios 5 — 33 versículos e paráfrase sinalizada", () => {
 assert.equal(bible.chapters["5"].length,33);
 assert.match(study,/Paráfrase livre original/);
 const scripture=study.match(/"id": "leitura-integral"[\s\S]*?"id": "introducao"/)?.[0] || "";
 for(let i=1;i<=33;i++) assert.match(scripture,new RegExp("\\\\n\\\\n\\\\*\\\\*"+i+"\\\\.\\\\*\\\\*"));
});
test("Efésios 5 — IDs únicos e catálogo único", () => {
 const ids=[...study.matchAll(/"id": "([^"]+)"/g)].map(m=>m[1]);
 assert.ok(ids.length>=18);
 assert.equal(ids.length,new Set(ids).size);
 assert.equal((catalog.match(/"biblia-efesios-cap-5":/g)||[]).length,1);
 assert.equal((catalog.match(/import \{ ephesians5Study \} from "\.\/ephesians-5-study";/g)||[]).length,1);
});
