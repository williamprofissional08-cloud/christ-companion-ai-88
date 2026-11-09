import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const curatedBatch = [
  { book: "Gênesis", chapter: 45, verseCount: 28, slug: "biblia-genesis-cap-45", exportName: "genesis45Study", file: "genesis-45-study.ts" },
  { book: "Gênesis", chapter: 46, verseCount: 34, slug: "biblia-genesis-cap-46", exportName: "genesis46Study", file: "genesis-46-study.ts" },
  { book: "Gênesis", chapter: 47, verseCount: 31, slug: "biblia-genesis-cap-47", exportName: "genesis47Study", file: "genesis-47-study.ts" },
  { book: "Gênesis", chapter: 48, verseCount: 22, slug: "biblia-genesis-cap-48", exportName: "genesis48Study", file: "genesis-48-study.ts" },
  { book: "Gênesis", chapter: 49, verseCount: 33, slug: "biblia-genesis-cap-49", exportName: "genesis49Study", file: "genesis-49-study.ts" },
  { book: "Gênesis", chapter: 50, verseCount: 26, slug: "biblia-genesis-cap-50", exportName: "genesis50Study", file: "genesis-50-study.ts" },
  { book: "Êxodo", chapter: 1, verseCount: 22, slug: "biblia-exodo-cap-1", exportName: "exodus1Study", file: "exodus-1-study.ts" },
];

async function readContent(path) {
  return readFile(new URL("../" + path, import.meta.url), "utf8");
}

function extractSectionReferences(source) {
  const arrays = [...source.matchAll(/["']?scriptureRefs["']?\s*:\s*\[([\s\S]*?)\]/g)];
  return arrays.flatMap(([, section]) =>
    [...section.matchAll(/["'`]([^"'`]+)["'`]/g)].flatMap(([, reference]) =>
      reference.split(";").map((part) => part.trim()).filter(Boolean),
    ),
  );
}

describe("estudos bíblicos curados: registro e cobertura das perícopes", () => {
  it("mantém Gênesis 1 registrado como referência curada", async () => {
    const registry = await readContent("src/lib/content/curated-studies.ts");
    assert.match(registry, /["']genesis-1-criacao["']\s*:\s*genesis1Study/);
  });

  for (const study of curatedBatch) {
    it(study.book + " " + study.chapter + " está registrado e cobre todos os versículos nas seções", async () => {
      const source = await readContent("src/lib/content/" + study.file);
      const registry = await readContent("src/lib/content/curated-studies.ts");
      const fileBase = study.file.replace(/\.ts$/, "");

      assert.match(
        registry,
        new RegExp("import\\s*\\{\\s*" + study.exportName + "\\s*\\}\\s*from\\s*[\"']\\./" + fileBase + "[\"']"),
        "o arquivo do estudo precisa ser importado pelo catálogo curado",
      );
      assert.match(
        registry,
        new RegExp("[\"']" + study.slug + "[\"']\\s*:\\s*" + study.exportName),
        "o estudo precisa estar associado ao slug canônico",
      );

      const references = extractSectionReferences(source);
      assert.ok(references.length > 0, "o estudo precisa declarar referências nas seções");

      const chapterPattern = new RegExp(
        "^" + study.book + "\\s+" + study.chapter + ":\\s*(\\d+)(?:\\s*[–—-]\\s*(\\d+))?$",
        "u",
      );
      const covered = new Set();
      const chapterReferences = references.filter((reference) =>
        reference.startsWith(study.book + " " + study.chapter + ":"),
      );

      assert.ok(chapterReferences.length > 0, "nenhuma perícope do próprio capítulo foi encontrada");

      for (const reference of chapterReferences) {
        const match = chapterPattern.exec(reference);
        assert.ok(match, "referência do capítulo não reconhecida: " + reference);
        const firstVerse = Number(match[1]);
        const lastVerse = Number(match[2] ?? match[1]);

        assert.ok(firstVerse >= 1 && lastVerse >= firstVerse, "intervalo inválido: " + reference);
        assert.ok(lastVerse <= study.verseCount, "referência ultrapassa o capítulo: " + reference);

        for (let verse = firstVerse; verse <= lastVerse; verse += 1) covered.add(verse);
      }

      const missing = Array.from({ length: study.verseCount }, (_, index) => index + 1)
        .filter((verse) => !covered.has(verse));
      assert.deepEqual(missing, [], "versículos sem cobertura nas seções: " + missing.join(", "));
    });
  }
});
