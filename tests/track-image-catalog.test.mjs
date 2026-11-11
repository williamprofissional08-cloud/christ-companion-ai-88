import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { TRACK_IMAGE_CATALOG } from "../src/lib/content/track-image-catalog.ts";

const root = process.cwd();

test("o catálogo de imagens possui oito temas com identificadores únicos", () => {
  assert.equal(TRACK_IMAGE_CATALOG.length, 8);
  assert.equal(new Set(TRACK_IMAGE_CATALOG.map((image) => image.id)).size, 8);
  assert.deepEqual(
    new Set(TRACK_IMAGE_CATALOG.map((image) => image.theme)),
    new Set(["Ansiedade", "Fé", "Oração", "Perdão", "Identidade", "Propósito", "Gratidão", "Esperança"]),
  );
});

test("cada imagem do catálogo é empacotada localmente, tem texto alternativo e tamanho otimizado", () => {
  for (const image of TRACK_IMAGE_CATALOG) {
    const localPath = path.join(root, "public", image.src.replace(/^\//, ""));
    assert.ok(existsSync(localPath), `imagem ausente: ${image.src}`);
    assert.ok(image.alt.trim().length > 10, `texto alternativo ausente: ${image.id}`);
    assert.ok(statSync(localPath).size < 300_000, `imagem não otimizada: ${image.id}`);
  }
});
