import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const curatedSource = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const handlerSource = readFileSync(new URL("../src/lib/ai.functions.ts", import.meta.url), "utf8");

test("Genesis 1 remains registered as a deep curated local study", () => {
  assert.match(curatedSource, /const genesis1: StudyContent =/);
  assert.match(curatedSource, /"genesis-1-criacao": genesis1/);
  assert.match(curatedSource, /depth: "deep"/);
  assert.match(curatedSource, /title: "16\. Oficina do pregador/);
});

test("study loader returns curated content when managed content lookup fails", () => {
  const loader = handlerSource.slice(
    handlerSource.indexOf("export const getStudyContent"),
    handlerSource.indexOf("export const searchScriptures"),
  );

  assert.match(loader, /catch \(error\)[\s\S]*if \(curated\) return curated/);
  assert.match(loader, /CURATED_STUDIES\[data\.slug\]/);
});
