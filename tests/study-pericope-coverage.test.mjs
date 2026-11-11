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
  { book: "Números", chapter: 31, verseCount: 54, slug: "biblia-numeros-cap-31", exportName: "Numbers31Study", file: "numbers-31-study.ts" },
  { book: "Números", chapter: 32, verseCount: 42, slug: "biblia-numeros-cap-32", exportName: "Numbers32Study", file: "numbers-32-study.ts" },
  { book: "Números", chapter: 33, verseCount: 56, slug: "biblia-numeros-cap-33", exportName: "Numbers33Study", file: "numbers-33-study.ts" },
  { book: "Números", chapter: 34, verseCount: 29, slug: "biblia-numeros-cap-34", exportName: "Numbers34Study", file: "numbers-34-study.ts" },
  { book: "Números", chapter: 35, verseCount: 34, slug: "biblia-numeros-cap-35", exportName: "Numbers35Study", file: "numbers-35-study.ts" },
  { book: "Números", chapter: 36, verseCount: 13, slug: "biblia-numeros-cap-36", exportName: "Numbers36Study", file: "numbers-36-study.ts" },
  { book: "Deuteronômio", chapter: 1, verseCount: 46, slug: "biblia-deuteronomio-cap-1", exportName: "deuteronomy1Study", file: "deuteronomy-1-study.ts" },
  { book: "Deuteronômio", chapter: 2, verseCount: 37, slug: "biblia-deuteronomio-cap-2", exportName: "deuteronomy2Study", file: "deuteronomy-2-study.ts" },
  { book: "Deuteronômio", chapter: 3, verseCount: 29, slug: "biblia-deuteronomio-cap-3", exportName: "deuteronomy3Study", file: "deuteronomy-3-study.ts" },
  { book: "Deuteronômio", chapter: 4, verseCount: 49, slug: "biblia-deuteronomio-cap-4", exportName: "deuteronomy4Study", file: "deuteronomy-4-study.ts" },
  { book: "Deuteronômio", chapter: 5, verseCount: 33, slug: "biblia-deuteronomio-cap-5", exportName: "deuteronomy5Study", file: "deuteronomy-5-study.ts" },
  { book: "Deuteronômio", chapter: 6, verseCount: 25, slug: "biblia-deuteronomio-cap-6", exportName: "deuteronomy6Study", file: "deuteronomy-6-study.ts" },
  { book: "Deuteronômio", chapter: 7, verseCount: 26, slug: "biblia-deuteronomio-cap-7", exportName: "deuteronomy7Study", file: "deuteronomy-7-study.ts" },
  { book: "Deuteronômio", chapter: 8, verseCount: 20, slug: "biblia-deuteronomio-cap-8", exportName: "deuteronomy8Study", file: "deuteronomy-8-study.ts" },
  { book: "Deuteronômio", chapter: 9, verseCount: 29, slug: "biblia-deuteronomio-cap-9", exportName: "deuteronomy9Study", file: "deuteronomy-9-study.ts" },
  { book: "Deuteronômio", chapter: 10, verseCount: 22, slug: "biblia-deuteronomio-cap-10", exportName: "deuteronomy10Study", file: "deuteronomy-10-study.ts" },
  { book: "Deuteronômio", chapter: 11, verseCount: 32, slug: "biblia-deuteronomio-cap-11", exportName: "deuteronomy11Study", file: "deuteronomy-11-study.ts" },
  { book: "Deuteronômio", chapter: 12, verseCount: 32, slug: "biblia-deuteronomio-cap-12", exportName: "deuteronomy12Study", file: "deuteronomy-12-study.ts" },
  { book: "Deuteronômio", chapter: 13, verseCount: 18, slug: "biblia-deuteronomio-cap-13", exportName: "deuteronomy13Study", file: "deuteronomy-13-study.ts" },
  { book: "Deuteronômio", chapter: 14, verseCount: 29, slug: "biblia-deuteronomio-cap-14", exportName: "deuteronomy14Study", file: "deuteronomy-14-study.ts" },
  { book: "Deuteronômio", chapter: 15, verseCount: 23, slug: "biblia-deuteronomio-cap-15", exportName: "deuteronomy15Study", file: "deuteronomy-15-study.ts" },
  { book: "Deuteronômio", chapter: 16, verseCount: 22, slug: "biblia-deuteronomio-cap-16", exportName: "deuteronomy16Study", file: "deuteronomy-16-study.ts" },
  { book: "Deuteronômio", chapter: 17, verseCount: 20, slug: "biblia-deuteronomio-cap-17", exportName: "deuteronomy17Study", file: "deuteronomy-17-study.ts" },
  { book: "Deuteronômio", chapter: 18, verseCount: 22, slug: "biblia-deuteronomio-cap-18", exportName: "deuteronomy18Study", file: "deuteronomy-18-study.ts" },
  { book: "Deuteronômio", chapter: 19, verseCount: 21, slug: "biblia-deuteronomio-cap-19", exportName: "deuteronomy19Study", file: "deuteronomy-19-study.ts" },
  { book: "Deuteronômio", chapter: 20, verseCount: 20, slug: "biblia-deuteronomio-cap-20", exportName: "deuteronomy20Study", file: "deuteronomy-20-study.ts" },
  { book: "Deuteronômio", chapter: 21, verseCount: 23, slug: "biblia-deuteronomio-cap-21", exportName: "deuteronomy21Study", file: "deuteronomy-21-study.ts" },
  { book: "Deuteronômio", chapter: 22, verseCount: 30, slug: "biblia-deuteronomio-cap-22", exportName: "deuteronomy22Study", file: "deuteronomy-22-study.ts" },
  { book: "Deuteronômio", chapter: 23, verseCount: 25, slug: "biblia-deuteronomio-cap-23", exportName: "deuteronomy23Study", file: "deuteronomy-23-study.ts" },
  { book: "Deuteronômio", chapter: 24, verseCount: 22, slug: "biblia-deuteronomio-cap-24", exportName: "deuteronomy24Study", file: "deuteronomy-24-study.ts" },
  { book: "Deuteronômio", chapter: 25, verseCount: 19, slug: "biblia-deuteronomio-cap-25", exportName: "deuteronomy25Study", file: "deuteronomy-25-study.ts" },
  { book: "Deuteronômio", chapter: 26, verseCount: 19, slug: "biblia-deuteronomio-cap-26", exportName: "deuteronomy26Study", file: "deuteronomy-26-study.ts" },
  { book: "Deuteronômio", chapter: 27, verseCount: 26, slug: "biblia-deuteronomio-cap-27", exportName: "deuteronomy27Study", file: "deuteronomy-27-study.ts" },
  { book: "Deuteronômio", chapter: 28, verseCount: 68, slug: "biblia-deuteronomio-cap-28", exportName: "deuteronomy28Study", file: "deuteronomy-28-study.ts" },
  { book: "Deuteronômio", chapter: 29, verseCount: 29, slug: "biblia-deuteronomio-cap-29", exportName: "deuteronomy29Study", file: "deuteronomy-29-study.ts" },
  { book: "Deuteronômio", chapter: 30, verseCount: 20, slug: "biblia-deuteronomio-cap-30", exportName: "deuteronomy30Study", file: "deuteronomy-30-study.ts" },
  { book: "Deuteronômio", chapter: 31, verseCount: 30, slug: "biblia-deuteronomio-cap-31", exportName: "deuteronomy31Study", file: "deuteronomy-31-study.ts" },
  { book: "Deuteronômio", chapter: 32, verseCount: 52, slug: "biblia-deuteronomio-cap-32", exportName: "deuteronomy32Study", file: "deuteronomy-32-study.ts" },
  { book: "Deuteronômio", chapter: 33, verseCount: 29, slug: "biblia-deuteronomio-cap-33", exportName: "deuteronomy33Study", file: "deuteronomy-33-study.ts" },
  { book: "Deuteronômio", chapter: 34, verseCount: 12, slug: "biblia-deuteronomio-cap-34", exportName: "deuteronomy34Study", file: "deuteronomy-34-study.ts" },
  { book: "Josué", chapter: 1, verseCount: 18, slug: "biblia-josue-cap-1", exportName: "joshua1Study", file: "joshua-1-study.ts" },
  { book: "Josué", chapter: 2, verseCount: 24, slug: "biblia-josue-cap-2", exportName: "joshua2Study", file: "joshua-2-study.ts" },
  { book: "Josué", chapter: 3, verseCount: 17, slug: "biblia-josue-cap-3", exportName: "joshua3Study", file: "joshua-3-study.ts" },
  { book: "Josué", chapter: 4, verseCount: 24, slug: "biblia-josue-cap-4", exportName: "joshua4Study", file: "joshua-4-study.ts" },
  { book: "Josué", chapter: 5, verseCount: 15, slug: "biblia-josue-cap-5", exportName: "joshua5Study", file: "joshua-5-study.ts" },
  { book: "Josué", chapter: 6, verseCount: 27, slug: "biblia-josue-cap-6", exportName: "joshua6Study", file: "joshua-6-study.ts" },
  { book: "Josué", chapter: 7, verseCount: 26, slug: "biblia-josue-cap-7", exportName: "joshua7Study", file: "joshua-7-study.ts" },
  { book: "Josué", chapter: 8, verseCount: 35, slug: "biblia-josue-cap-8", exportName: "joshua8Study", file: "joshua-8-study.ts" },
  { book: "Josué", chapter: 9, verseCount: 27, slug: "biblia-josue-cap-9", exportName: "joshua9Study", file: "joshua-9-study.ts" },
  { book: "Josué", chapter: 10, verseCount: 43, slug: "biblia-josue-cap-10", exportName: "joshua10Study", file: "joshua-10-study.ts" },
  { book: "Josué", chapter: 11, verseCount: 23, slug: "biblia-josue-cap-11", exportName: "joshua11Study", file: "joshua-11-study.ts" },
  { book: "Josué", chapter: 12, verseCount: 24, slug: "biblia-josue-cap-12", exportName: "joshua12Study", file: "joshua-12-study.ts" },
  { book: "Josué", chapter: 13, verseCount: 33, slug: "biblia-josue-cap-13", exportName: "joshua13Study", file: "joshua-13-study.ts" },
  { book: "Josué", chapter: 14, verseCount: 15, slug: "biblia-josue-cap-14", exportName: "joshua14Study", file: "joshua-14-study.ts" },
  { book: "Josué", chapter: 15, verseCount: 63, slug: "biblia-josue-cap-15", exportName: "joshua15Study", file: "joshua-15-study.ts" },
  { book: "Josué", chapter: 16, verseCount: 10, slug: "biblia-josue-cap-16", exportName: "joshua16Study", file: "joshua-16-study.ts" },
  { book: "Josué", chapter: 17, verseCount: 18, slug: "biblia-josue-cap-17", exportName: "joshua17Study", file: "joshua-17-study.ts" },
  { book: "Josué", chapter: 18, verseCount: 28, slug: "biblia-josue-cap-18", exportName: "joshua18Study", file: "joshua-18-study.ts" },
  { book: "Josué", chapter: 19, verseCount: 51, slug: "biblia-josue-cap-19", exportName: "joshua19Study", file: "joshua-19-study.ts" },
  { book: "Josué", chapter: 20, verseCount: 9, slug: "biblia-josue-cap-20", exportName: "joshua20Study", file: "joshua-20-study.ts" },
  { book: "Josué", chapter: 21, verseCount: 45, slug: "biblia-josue-cap-21", exportName: "joshua21Study", file: "joshua-21-study.ts" },
  { book: "Josué", chapter: 22, verseCount: 34, slug: "biblia-josue-cap-22", exportName: "joshua22Study", file: "joshua-22-study.ts" },
  { book: "Josué", chapter: 23, verseCount: 16, slug: "biblia-josue-cap-23", exportName: "joshua23Study", file: "joshua-23-study.ts" },
  { book: "Josué", chapter: 24, verseCount: 33, slug: "biblia-josue-cap-24", exportName: "joshua24Study", file: "joshua-24-study.ts" },
  { book: "Juízes", chapter: 1, verseCount: 36, slug: "biblia-juizes-cap-1", exportName: "judges1Study", file: "judges-1-study.ts" },
  { book: "Juízes", chapter: 2, verseCount: 23, slug: "biblia-juizes-cap-2", exportName: "judges2Study", file: "judges-2-study.ts" },
  { book: "Juízes", chapter: 3, verseCount: 31, slug: "biblia-juizes-cap-3", exportName: "judges3Study", file: "judges-3-study.ts" },
  { book: "Juízes", chapter: 4, verseCount: 24, slug: "biblia-juizes-cap-4", exportName: "judges4Study", file: "judges-4-study.ts" },
  { book: "Juízes", chapter: 5, verseCount: 31, slug: "biblia-juizes-cap-5", exportName: "judges5Study", file: "judges-5-study.ts" },
  { book: "Juízes", chapter: 6, verseCount: 40, slug: "biblia-juizes-cap-6", exportName: "judges6Study", file: "judges-6-study.ts" },
  { book: "Juízes", chapter: 7, verseCount: 25, slug: "biblia-juizes-cap-7", exportName: "judges7Study", file: "judges-7-study.ts" },
  { book: "Juízes", chapter: 8, verseCount: 35, slug: "biblia-juizes-cap-8", exportName: "judges8Study", file: "judges-8-study.ts" },
  { book: "Juízes", chapter: 9, verseCount: 57, slug: "biblia-juizes-cap-9", exportName: "judges9Study", file: "judges-9-study.ts" },
  { book: "Juízes", chapter: 10, verseCount: 18, slug: "biblia-juizes-cap-10", exportName: "judges10Study", file: "judges-10-study.ts" },
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
