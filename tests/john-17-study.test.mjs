import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file=fs.readFileSync(path.join(root,"src/lib/content/john-17-study.ts"),"utf8");
const match=file.match(/export const john17Study: StudyContent = ([\s\S]*);\s*$/);
assert.ok(match, "Expected typed exported study");
const study=JSON.parse(match[1]);
const verses=JSON.parse(fs.readFileSync(path.join(root,"src/lib/bible-livre/joao.json"),"utf8")).chapters["17"];
test("João 17: read all 26 source verses in order",()=>{
  assert.equal(verses.length,26);
  const reading=study.sections.find(s=>s.id==="leitura-integral");
  assert.ok(reading);
  for (let i=1;i<=26;i++){
    const line=verses[i-1].replace(/\s*João\s*<\s*17\s*>\s*$/i,"").trim();
    assert.ok(reading.body.includes("**"+i+"** "+line), "Missing verse in reading: "+i);
    const note=study.sections.find(s=>s.id==="versiculo-"+i);
    assert.ok(note, "Missing commentary on verse "+i);
    assert.ok(note.body.includes(line), "Verse text doesn't agree with BLIVRE for "+i);
    assert.ok(note.scriptureRefs.includes("João 17:"+i));
  }
});
test("João 17: chapter structure, safeguards and study questions",()=>{
  const ids=study.sections.map(s=>s.id);
  assert.equal(new Set(ids).size,ids.length);
  assert.equal(ids.filter(s=>s.startsWith("versiculo-")).length,26);
  assert.ok(study.questions.length>=15);
  assert.ok(study.crossReferences.length>=12);
  assert.ok(study.sections.some(s=>/pregador/i.test(s.title)));
  assert.ok(study.sections.some(s=>/debate|questões interpretativas/i.test(s.title)));
});
test("João 17: registered once with original stable slug",()=>{
  const c=fs.readFileSync(path.join(root,"src/lib/content/curated-studies.ts"),"utf8");
  assert.equal((c.match(/"biblia-joao-cap-17"\s*:/g)||[]).length,1);
  assert.ok(c.includes('import { john17Study } from "./john-17-study";'));
});