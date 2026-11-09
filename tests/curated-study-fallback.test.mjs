import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const curatedSource = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const genesis1Source = readFileSync(new URL("../src/lib/content/genesis-1-study.ts", import.meta.url), "utf8");
const handlerSource = readFileSync(new URL("../src/lib/ai.functions.ts", import.meta.url), "utf8");

test("Genesis 1 is registered and contains a structured, didactic study", () => {
  assert.match(curatedSource, /"genesis-1-criacao": genesis1Study/);
  assert.match(curatedSource, /from "\.\/genesis-1-study"/);
  assert.match(genesis1Source, /version: 3/);
  assert.match(genesis1Source, /title: "1\. Introdução/);
  assert.match(genesis1Source, /title: "2\. Contexto histórico/);
  assert.match(genesis1Source, /title: "4\. Tópico 1/);
  assert.match(genesis1Source, /title: "12\. Tópico 9/);
  assert.match(genesis1Source, /title: "17\. Exercícios/);
  assert.match(genesis1Source, /title: "18\. Oficina do pregador/);
  assert.equal((genesis1Source.match(/id: "topico-/g) ?? []).length, 9);
});

test("study loader returns curated content when managed content lookup fails", () => {
  const loader = handlerSource.slice(
    handlerSource.indexOf("export const getStudyContent"),
    handlerSource.indexOf("export const searchScriptures"),
  );

  assert.match(loader, /catch \(error\)[\s\S]*if \(curated\) return curated/);
  assert.match(loader, /CURATED_STUDIES\[data\.slug\]/);
});
