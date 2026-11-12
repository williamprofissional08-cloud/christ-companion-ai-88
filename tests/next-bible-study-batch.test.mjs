import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "scripts/next-bible-study-batch.mjs");

function run(bookSlug, startChapter, batchSize) {
  return spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      BOOK_SLUG: bookSlug,
      START_CHAPTER: String(startChapter),
      BATCH_SIZE: String(batchSize),
    },
  });
}

function values(stdout) {
  return Object.fromEntries(
    stdout
      .trim()
      .split(/\r?\n/)
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
}

test("Números 28–34 calcula o restante de Números 35–36", () => {
  const result = run("numeros", 28, 7);
  assert.equal(result.status, 0, result.stderr);
  const output = values(result.stdout);

  assert.equal(output.BATCH_END_CHAPTER, "34");
  assert.equal(output.BIBLE_FINISHED, "false");
  assert.equal(output.NEXT_BOOK_SLUG, "numeros");
  assert.equal(output.NEXT_START_CHAPTER, "35");
  assert.equal(output.NEXT_BATCH_SIZE, "2");
});

test("Números 35–36 avança para Deuteronômio 1–7", () => {
  const result = run("numeros", 35, 7);
  assert.equal(result.status, 0, result.stderr);
  const output = values(result.stdout);

  assert.equal(output.BATCH_END_CHAPTER, "36");
  assert.equal(output.NEXT_BOOK_SLUG, "deuteronomio");
  assert.equal(output.NEXT_START_CHAPTER, "1");
  assert.equal(output.NEXT_BATCH_SIZE, "7");
});

test("Apocalipse 22 encerra a sequência dos 66 livros", () => {
  const result = run("apocalipse", 22, 7);
  assert.equal(result.status, 0, result.stderr);
  const output = values(result.stdout);

  assert.equal(output.BATCH_END_CHAPTER, "22");
  assert.equal(output.BIBLE_FINISHED, "true");
});

test("rejeita lotes maiores que sete capítulos", () => {
  const result = run("numeros", 28, 8);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /1 a 7 capítulos/);
});
