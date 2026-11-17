import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const study = readFileSync(new URL("../src/lib/content/1-timothy-4-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("1 Timóteo 4 — cobertura, IDs e catálogo", () => {
  const ids = [...study.matchAll(/"id": "([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  assert.ok(ids.length >= 18);
  for (let n = 1; n <= 16; n++) {
    assert.ok(ids.includes(`versiculo-${n}`), `exposição ausente: ${n}`);
    assert.ok(study.includes(`**${n}.**`), `paráfrase ausente: ${n}`);
  }
  assert.ok(study.includes("não é tradução bíblica oficial"));
  assert.equal(catalog.match(/"biblia-1-timoteo-cap-4": firstTimothy4Study/g)?.length, 1);
  assert.equal(catalog.match(/import \{ firstTimothy4Study \} from/g)?.length, 1);
});
