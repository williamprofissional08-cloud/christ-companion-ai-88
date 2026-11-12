import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { BIBLE_BOOKS, parseBibleReference } from "../src/lib/bible-catalog.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bibleDataDir = path.join(repoRoot, "src/lib/bible-livre");

function loadBook(slug) {
  return JSON.parse(readFileSync(path.join(bibleDataDir, `${slug}.json`), "utf8"));
}

test("BLIVRE contém os 66 livros e todos os 1.189 capítulos do catálogo", () => {
  const dataFiles = readdirSync(bibleDataDir).filter((file) => file.endsWith(".json"));
  assert.equal(dataFiles.length, 66);
  assert.equal(BIBLE_BOOKS.length, 66);

  let chapterTotal = 0;
  let verseTotal = 0;
  for (const book of BIBLE_BOOKS) {
    const data = loadBook(book.id);
    assert.equal(data.translation, "BLIVRE", `${book.id} must identify the translation`);
    assert.equal(Object.keys(data.chapters).length, book.chapters, `${book.name} chapter count`);
    for (let chapter = 1; chapter <= book.chapters; chapter += 1) {
      const verses = data.chapters[String(chapter)];
      assert.ok(
        Array.isArray(verses) && verses.length > 0,
        `${book.name} ${chapter} must have verses`,
      );
      assert.ok(verses.every((verse) => typeof verse === "string" && verse.trim().length > 0));
      chapterTotal += 1;
      verseTotal += verses.length;
    }
  }
  assert.equal(chapterTotal, 1189);
  assert.equal(verseTotal, 31102);
});

test("o parser só aceita referências completas e versículos positivos", () => {
  assert.deepEqual(parseBibleReference("João 3:16"), {
    livro: "joao",
    capitulo: 3,
    versiculo: 16,
  });
  assert.equal(parseBibleReference("João 3:16 texto extra"), undefined);
  assert.equal(parseBibleReference("João 3:0"), undefined);
});

test("BLIVRE mantém amostras de referência e créditos de licença", () => {
  const genesis = loadBook("genesis");
  const john = loadBook("joao");
  const revelation = loadBook("apocalipse");
  const licenseDoc = readFileSync(path.join(repoRoot, "docs-bible-license.md"), "utf8");

  assert.equal(genesis.chapters["1"][0], "No princípio criou Deus os céus e a terra.");
  assert.match(john.chapters["3"][15], /Deus amou ao mundo/);
  assert.match(revelation.chapters["22"].at(-1), /Amém/);
  assert.match(licenseDoc, /Diego Santos, Mario Sérgio e Marco Teles/);
  assert.match(licenseDoc, /Creative Commons Atribuição 4\.0 Brasil/);
});
