import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const curatedSource = readFileSync(new URL("../src/lib/content/curated-studies.ts", import.meta.url), "utf8");
const genesis1Source = readFileSync(new URL("../src/lib/content/genesis-1-study.ts", import.meta.url), "utf8");
const handlerSource = readFileSync(new URL("../src/lib/ai.functions.ts", import.meta.url), "utf8");

test("Genesis 1 is registered and contains a structured, didactic study", () => {
  assert.match(curatedSource, /"genesis-1-criacao": genesis1Study/);
  assert.match(curatedSource, /from "\.\/genesis-1-study"/);
  assert.match(genesis1Source, /version: 4/);
  assert.match(genesis1Source, /title: "1\. Introdução/);
  assert.match(genesis1Source, /title: "2\. Contexto histórico/);
  assert.match(genesis1Source, /title: "4\. Tópico 1/);
  assert.match(genesis1Source, /title: "12\. Tópico 9/);
  assert.match(genesis1Source, /title: "17\. Exercícios/);
  assert.match(genesis1Source, /title: "18\. Oficina do pregador/);
  assert.equal((genesis1Source.match(/id: "topico-/g) ?? []).length, 9);
  assert.match(genesis1Source, /id: "leitura-biblica-completa"/);
  assert.match(genesis1Source, /id: "palavras-chave"/);
  assert.match(genesis1Source, /id: "questoes-interpretativas"/);
  assert.match(genesis1Source, /id: "referencias-explicadas"/);
  assert.match(genesis1Source, /id: "erros-interpretacao"/);
  assert.doesNotMatch(genesis1Source, /\\*\\*Explicação:\\*\\*\`/, "Explanatory prose must remain inside each section template literal");
  assert.match(genesis1Source, /Elohim/);
  assert.match(genesis1Source, /não prova a doutrina da Trindade/);
  assert.match(genesis1Source, /não menciona uma guerra entre Deus e Satanás/);
  for (let verse = 1; verse <= 31; verse += 1) {
    assert.match(genesis1Source, new RegExp(`\\*\\*${verse}\\*\\*`), `Genesis 1 verse ${verse} must be included`);
  }
  for (const reference of ["Gênesis 1:1-2", "Gênesis 1:3-5", "Gênesis 1:6-8", "Gênesis 1:9-13", "Gênesis 1:14-19", "Gênesis 1:20-23", "Gênesis 1:24-28", "Gênesis 1:29-30", "Gênesis 1:31"]) {
    assert.ok(genesis1Source.includes(`Texto bíblico — ${reference}`), `Teaching topic must display ${reference}`);
  }
});

test("study loader returns curated content when managed content lookup fails", () => {
  const loader = handlerSource.slice(
    handlerSource.indexOf("export const getStudyContent"),
    handlerSource.indexOf("export const searchScriptures"),
  );

  assert.match(loader, /catch \(error\)[\s\S]*if \(curated\) return curated/);
  assert.match(loader, /CURATED_STUDIES\[data\.slug\]/);
});
