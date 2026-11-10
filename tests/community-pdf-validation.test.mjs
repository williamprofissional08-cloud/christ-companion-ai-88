import test from "node:test";
import assert from "node:assert/strict";
import { validateCommunityPdf, COMMUNITY_PDF_MAX_BYTES } from "../src/lib/community-pdf-validation.ts";

function file({ name = "material.pdf", type = "application/pdf", content = "%PDF-1.7", size } = {}) {
  const blob = new Blob([content]);
  return {
    name,
    type,
    size: size ?? blob.size,
    slice: (start, end) => blob.slice(start, end),
  };
}

test("accepts a PDF with matching extension, MIME type and signature", async () => {
  assert.deepEqual(await validateCommunityPdf(file()), { valid: true });
});

test("rejects a non-PDF extension even when MIME type claims PDF", async () => {
  const result = await validateCommunityPdf(file({ name: "payload.exe" }));
  assert.equal(result.valid, false);
});

test("rejects a conflicting declared MIME type", async () => {
  const result = await validateCommunityPdf(file({ type: "application/octet-stream" }));
  assert.equal(result.valid, false);
});

test("rejects a file without the PDF magic header", async () => {
  const result = await validateCommunityPdf(file({ content: "MZ fake executable" }));
  assert.equal(result.valid, false);
});

test("rejects empty and oversized files", async () => {
  assert.equal((await validateCommunityPdf(file({ content: "" }))).valid, false);
  assert.equal((await validateCommunityPdf(file({ size: COMMUNITY_PDF_MAX_BYTES + 1 }))).valid, false);
});

test("accepts an empty browser MIME type only when extension and signature match", async () => {
  assert.deepEqual(await validateCommunityPdf(file({ type: "" })), { valid: true });
});
