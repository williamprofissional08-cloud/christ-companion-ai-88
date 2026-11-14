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
  assert.equal(genesis1Source.includes("**Explicação:**`"), false, "Explanatory prose must remain inside each section template literal");
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


test("devotional pipeline always has a local fallback for backend and AI failures", () => {
  const devotional = handlerSource.slice(
    handlerSource.indexOf("export const getDevotional"),
    handlerSource.indexOf("export const getPlanDayContent"),
  );

  assert.match(devotional, /const \{ fallbackDevotional \} = await import\("\.\/content\/fallback-devotional"\)/);
  assert.match(devotional, /catch \(error\)[\s\S]*return fallbackDevotional\(data\.day\)/);
  assert.match(devotional, /catch \(aiError\)[\s\S]*return fallbackDevotional\(data\.day\)/);
});

test("reviewed local chapter studies cannot be hidden by archived managed catalog rows", () => {
  const detailRoute = readFileSync(
    new URL("../src/routes/_authenticated/estudos.$slug.tsx", import.meta.url),
    "utf8",
  );

  assert.match(detailRoute, /resolveManagedStudy\(legacyStudy, managedStudy, Boolean\(CURATED_STUDIES\[slug\]\)\)/);
  const catalogSource = readFileSync(new URL("../src/lib/content/managed-study-catalog.ts", import.meta.url), "utf8");
  assert.match(catalogSource, /if \(!managed \|\| isCurated\) return local/);
  assert.match(catalogSource, /if \(managed\.status === "archived"\) return undefined/);
});

// Execute the same resolver used by both pages; source assertions alone do not prove behavior.
import { resolveManagedStudy } from "../src/lib/content/managed-study-catalog.ts";

test("curated archived study stays in listing and detail; uncurated archived study is hidden", () => {
  const listingRoute = readFileSync(new URL("../src/routes/_authenticated/estudos.index.tsx", import.meta.url), "utf8");
  const detailRoute = readFileSync(new URL("../src/routes/_authenticated/estudos.$slug.tsx", import.meta.url), "utf8");
  assert.match(listingRoute, /resolveManagedStudy\\(catalog\\.get\\(item\\.slug\\), item, Boolean\\(CURATED_STUDIES\\[item\\.slug\\]\\)\\)/);
  assert.match(detailRoute, /resolveManagedStudy\\(legacyStudy, managedStudy, Boolean\\(CURATED_STUDIES\\[slug\\]\\)\\)/);

  const local = { slug: "genesis-1-criacao", title: "Gênesis 1", category: "Bíblia", reference: "Gênesis 1", summary: "Criação", depth: "deep" };
  const archived = { slug: local.slug, status: "archived", metadata: { title: "Ocultado" } };
  const catalog = new Map([[local.slug, local]]);
  const listed = resolveManagedStudy(catalog.get(archived.slug), archived, true);
  if (listed) catalog.set(archived.slug, listed);
  else catalog.delete(archived.slug);
  assert.deepEqual(catalog.get(local.slug), local, "listagem preserva o estudo curado");
  assert.deepEqual(resolveManagedStudy(local, archived, true), local, "detalhe preserva o estudo curado");
  assert.equal(resolveManagedStudy(undefined, { ...archived, slug: "sem-local" }, false), undefined);
});
