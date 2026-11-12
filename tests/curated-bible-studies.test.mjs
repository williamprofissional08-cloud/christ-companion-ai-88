import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readSource = (relativePath) =>
  readFileSync(path.join(root, relativePath), "utf8");

const bibleBooksSource = readSource("src/lib/content/bible-books.ts");
const curatedSource = readSource("src/lib/content/curated-studies.ts");

test("o catálogo bíblico mantém os 66 livros e 1.189 capítulos", () => {
  const books = [
    ...bibleBooksSource.matchAll(
      /\{\s*slug:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*chapters:\s*(\d+)/g,
    ),
  ];

  assert.equal(books.length, 66, "o catálogo deve conter exatamente 66 livros");
  assert.equal(
    new Set(books.map((book) => book[1])).size,
    66,
    "os slugs dos livros devem ser únicos",
  );
  assert.equal(
    books.reduce((total, book) => total + Number(book[3]), 0),
    1189,
    "a soma dos capítulos deve ser 1.189",
  );
  assert.match(
    bibleBooksSource,
    /bookSlug === "genesis" && chapter === 1 \? "genesis-1-criacao"/,
    "Gênesis 1 deve preservar seu endereço curado especial",
  );
});

test("cada estudo curado está ligado a um módulo existente", () => {
  const imports = new Map(
    [
      ...curatedSource.matchAll(
        /import\s*\{\s*(\w+)\s*\}\s*from\s*"\.\/([^"]+)";/g,
      ),
    ].map((match) => [match[1], match[2]]),
  );
  const entries = [
    ...curatedSource.matchAll(/"([^"]+)":\s*(\w+)\s*,/g),
  ];

  assert.ok(entries.length > 0, "o catálogo curado não pode ficar vazio");
  assert.equal(
    new Set(entries.map((entry) => entry[1])).size,
    entries.length,
    "não pode haver endereços duplicados no catálogo curado",
  );

  for (const [, slug, exportName] of entries) {
    const moduleName = imports.get(exportName);
    assert.ok(moduleName, `o estudo ${slug} precisa ter import correspondente`);
    assert.doesNotThrow(
      () => readSource(`src/lib/content/${moduleName}.ts`),
      `o arquivo do estudo ${slug} precisa existir`,
    );
  }
});

test("todos os estudos curados mantêm profundidade e estrutura didática", () => {
  const imports = new Map(
    [
      ...curatedSource.matchAll(
        /import\s*\{\s*(\w+)\s*\}\s*from\s*"\.\/([^"]+)";/g,
      ),
    ].map((match) => [match[1], match[2]]),
  );
  const entries = [
    ...curatedSource.matchAll(/"([^"]+)":\s*(\w+)\s*,/g),
  ];

  for (const [, slug, exportName] of entries) {
    const moduleName = imports.get(exportName);
    assert.ok(moduleName, `import ausente para ${slug}`);
    const source = readSource(`src/lib/content/${moduleName}.ts`);

    assert.match(source, /["]?depth["]?\s*:\s*["]?deep["]?/, `${slug} deve ser profundo`);
    for (const field of [
      "intro",
      "historicalContext",
      "keyPoints",
      "application",
      "crossReferences",
      "questions",
      "conclusion",
      "prayer",
      "sections",
    ]) {
      assert.match(
        source,
        new RegExp(`["]?${field}["]?\\s*:`),
        `${slug} precisa manter o campo didático ${field}`,
      );
    }
    assert.match(
      source,
      /["]?sections["]?\s*:\s*\[/,
      `${slug} precisa conter seções de estudo`,
    );
  }
});


test("Salmos 23 mantém exposição completa e referências corretas", () => {
  const source = readSource("src/lib/content/psalm-23-study.ts");

  assert.match(source, /export const psalm23Study: StudyContent/);
  assert.match(source, /depth:\s*"deep"/);
  assert.match(source, /Salmos 23:4(?!-4)/);
  assert.doesNotMatch(source, /Salmos 23:4-4/);
  assert.doesNotMatch(source, /23:4-4/);

  for (const verse of [1, 2, 3, 4, 5, 6]) {
    assert.match(
      source,
      new RegExp(`\\*\\*Versículo ${verse} —`),
      `a leitura orientada deve contemplar o versículo ${verse}`,
    );
  }

  for (const sectionId of [
    "contexto-historico",
    "estrutura",
    "palavras-chave",
    "questoes-interpretativas",
    "referencias-biblicas",
    "cuidados",
    "conexao-cristo",
    "aplicacao",
    "exercicios",
    "preparacao-mensagem",
    "oracao-final",
  ]) {
    assert.match(
      source,
      new RegExp(`id: "${sectionId}"`),
      `Salmos 23 deve conter a seção ${sectionId}`,
    );
  }

  assert.match(source, /João 10:1-18/);
  assert.match(source, /não promete.*riqueza|não.*promessa de riqueza/i);
});
