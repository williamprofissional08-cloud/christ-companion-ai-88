import test from "node:test";
import assert from "node:assert/strict";
import { BIBLE_BOOKS, BIBLE_CHAPTER_TOTAL } from "../src/lib/content/bible-books.ts";
import { BIBLE_BOOK_COVER_SLUGS, getBibleBookCover } from "../src/lib/content/bible-book-covers.ts";

test("cada um dos 66 livros possui uma capa ilustrada própria", () => {
  assert.equal(BIBLE_BOOKS.length, 66);
  assert.equal(BIBLE_CHAPTER_TOTAL, 1189);
  assert.equal(BIBLE_BOOK_COVER_SLUGS.length, 66);
  assert.deepEqual(
    [...BIBLE_BOOK_COVER_SLUGS].sort(),
    BIBLE_BOOKS.map((book) => book.slug).sort(),
  );

  const covers = BIBLE_BOOKS.map((book) => getBibleBookCover(book));
  assert.equal(new Set(covers).size, 66);
  for (const [index, cover] of covers.entries()) {
    assert.ok(cover.startsWith("data:image/svg+xml;charset=utf-8,"));
    const svg = decodeURIComponent(cover.slice("data:image/svg+xml;charset=utf-8,".length));
    assert.match(svg, /^<svg /);
    assert.match(svg, /<\/svg>$/);
    assert.ok(svg.includes(BIBLE_BOOKS[index].name.replace(/&/g, "&amp;")));
    assert.equal(getBibleBookCover(BIBLE_BOOKS[index]), cover);
  }
});
