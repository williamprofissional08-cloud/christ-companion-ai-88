import { readFileSync } from "node:fs";

const source = readFileSync("src/lib/content/bible-books.ts", "utf8");
const objects = [...source.matchAll(/\{([^{}]*\bslug\s*:[^{}]*)\}/gs)];

const books = objects
  .map(([, item]) => {
    const field = (pattern) => item.match(pattern)?.[1] ?? null;
    const slug = field(/\bslug\s*:\s*"([^"]+)"/);
    const chapters = Number(field(/\bchapters\s*:\s*(\d+)/));
    const order = Number(field(/\border\s*:\s*(\d+)/));

    if (!slug || !Number.isInteger(chapters) || chapters < 1 || !Number.isInteger(order)) {
      return null;
    }

    return { slug, chapters, order };
  })
  .filter(Boolean)
  .sort((left, right) => left.order - right.order);

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (books.length !== 66) {
  fail(`Índice bíblico inválido: esperados 66 livros, encontrados ${books.length}.`);
}

const bookSlug = process.env.BOOK_SLUG?.trim();
const startChapter = Number(process.env.START_CHAPTER);
const batchSize = Number(process.env.BATCH_SIZE);

if (!bookSlug || !Number.isInteger(startChapter) || !Number.isInteger(batchSize)) {
  fail("BOOK_SLUG, START_CHAPTER e BATCH_SIZE precisam ser informados.");
}

if (batchSize < 1 || batchSize > 7) {
  fail("O lote deve examinar de 1 a 7 capítulos.");
}

const currentIndex = books.findIndex((book) => book.slug === bookSlug);

if (currentIndex < 0) {
  fail(`Livro não encontrado no índice bíblico: ${bookSlug}.`);
}

const current = books[currentIndex];

if (startChapter < 1 || startChapter > current.chapters) {
  fail(`Capítulo inicial inválido para ${bookSlug}: ${startChapter}.`);
}

const batchEnd = Math.min(startChapter + batchSize - 1, current.chapters);
let nextBook = current;
let nextStart = batchEnd + 1;
let bibleFinished = false;

if (batchEnd === current.chapters) {
  if (currentIndex + 1 < books.length) {
    nextBook = books[currentIndex + 1];
    nextStart = 1;
  } else {
    bibleFinished = true;
    nextBook = current;
    nextStart = 1;
  }
}

const nextBatchSize = bibleFinished
  ? 1
  : Math.min(batchSize, nextBook.chapters - nextStart + 1);

console.log(`BATCH_END_CHAPTER=${batchEnd}`);
console.log(`BIBLE_FINISHED=${bibleFinished}`);
console.log(`NEXT_BOOK_SLUG=${nextBook.slug}`);
console.log(`NEXT_START_CHAPTER=${nextStart}`);
console.log(`NEXT_BATCH_SIZE=${nextBatchSize}`);
