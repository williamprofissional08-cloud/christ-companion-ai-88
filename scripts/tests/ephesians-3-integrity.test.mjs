import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

const source = readFileSync(new URL("../../src/lib/content/ephesians-3-study.ts", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
test("Efésios 3: estudo, versos e catálogo", () => {
  assert.match(source, /export const ephesians3Study: StudyContent/);
  const match = source.match(/export const ephesians3Study: StudyContent = ([\\s\\S]*);\\s*$/);
  assert.ok(match, "StudyContent serializado");
  const study = JSON.parse(match[1]);
  assert.equal(study.sections.filter(s => s.kind === "scripture").length, 1);
  const reading = study.sections.find(s => s.kind === "scripture").body;
  const nums = [...reading.matchAll(/\\*\\*(\\d+)\\.\\*\\*/g)].map(m => Number(m[1]));
  assert.deepEqual(nums, Array.from({length:21}, (_,i) => i+1));
  assert.equal(study.sections.length >= 30, true);
  assert.equal(new Set(study.sections.map(s => s.id)).size, study.sections.length);
  for (let v=1;v<=21;v++) assert.ok(study.sections.some(s => s.id === `exposicao-v${v}`));
  assert.equal((catalog.match(/"biblia-efesios-cap-3":/g)||[]).length,1);
  assert.equal((catalog.match(/import \\{ ephesians3Study \\} from/g)||[]).length,1);
});
