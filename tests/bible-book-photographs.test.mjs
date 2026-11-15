import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { BIBLE_BOOKS } from "../src/lib/content/bible-books.ts";
import { BIBLE_BOOK_PHOTOS, getBibleBookPhoto } from "../src/lib/content/bible-book-photographs.ts";

test("cada um dos 66 livros possui uma foto temática existente no app", () => {
  assert.equal(BIBLE_BOOKS.length, 66);
  assert.equal(Object.keys(BIBLE_BOOK_PHOTOS).length, 66);
  assert.deepEqual(
    Object.keys(BIBLE_BOOK_PHOTOS).sort(),
    BIBLE_BOOKS.map((book) => book.slug).sort(),
  );

  for (const book of BIBLE_BOOKS) {
    const photo = getBibleBookPhoto(book);
    assert.match(photo, /^\/images\/[a-z0-9/-]+\.webp$/);
    assert.ok(existsSync(join(process.cwd(), "public", photo.slice(1))), book.name + " não tem arquivo de imagem");
  }
});
