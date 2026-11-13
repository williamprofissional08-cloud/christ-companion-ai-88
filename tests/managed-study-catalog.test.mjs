import test from "node:test";
import assert from "node:assert/strict";
import { resolveManagedStudy } from "../src/lib/content/managed-study-catalog.ts";

const local = { slug: "genesis-1-criacao", title: "Gênesis 1", category: "Antigo Testamento", reference: "Gênesis 1", summary: "Criação", depth: "deep" };

test("estudo local revisado prevalece sobre registro arquivado", () => {
  assert.deepEqual(resolveManagedStudy(local, { slug: local.slug, status: "archived", metadata: {} }, true), local);
});

test("registro arquivado sem estudo local não aparece", () => {
  assert.equal(resolveManagedStudy(undefined, { slug: "inexistente", status: "archived", metadata: {} }, false), undefined);
});

test("falha na consulta preserva o estudo local quando não há catálogo", () => {
  assert.deepEqual(resolveManagedStudy(local, undefined, true), local);
});
