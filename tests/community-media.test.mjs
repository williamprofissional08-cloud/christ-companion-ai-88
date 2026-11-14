import assert from "node:assert/strict";
import { test } from "node:test";
import {
  validateCommunityMedia,
  COMMUNITY_MAX_VIDEO_SECONDS,
  COMMUNITY_MEDIA_MAX_BYTES,
} from "../src/lib/community-media.ts";

test("community accepts supported photos without a video duration", async () => {
  const result = await validateCommunityMedia({ type:"image/webp", size:512_000 });
  assert.deepEqual(result, {kind:"image",seconds:null,extension:"webp"});
});

test("community rejects oversized files and unsupported types", async () => {
  await assert.rejects(
    validateCommunityMedia({ type:"image/jpeg", size:COMMUNITY_MEDIA_MAX_BYTES+1 }),
    /até 49 MB/,
  );
  await assert.rejects(
    validateCommunityMedia({ type:"application/pdf", size:1_000 }),
    /Use foto/,
  );
});

test("community rejects videos longer than one minute", async () => {
  assert.equal(COMMUNITY_MAX_VIDEO_SECONDS,60);
  const oldCreateObjectURL=URL.createObjectURL;
  const oldRevokeObjectURL=URL.revokeObjectURL;
  const oldDocument=globalThis.document;
  const oldWindow=globalThis.window;
  const video={
    duration:61,
    onloadedmetadata:null,
    onerror:null,
    removeAttribute(){},
    load(){},
    set src(_value){queueMicrotask(()=>this.onloadedmetadata?.());},
  };
  try {
    URL.createObjectURL=()=> "blob:mock";
    URL.revokeObjectURL=()=> {};
    globalThis.window=globalThis;
    globalThis.document={createElement:(tag)=> {
      assert.equal(tag,"video");
      return video;
    }};
    await assert.rejects(
      validateCommunityMedia({type:"video/mp4",size:120_000}),
      /no máximo 1 minuto/,
    );
    video.duration=60;
    const valid=await validateCommunityMedia({type:"video/mp4",size:120_000});
    assert.deepEqual(valid,{kind:"video",seconds:60,extension:"mp4"});
  } finally {
    URL.createObjectURL=oldCreateObjectURL;
    URL.revokeObjectURL=oldRevokeObjectURL;
    globalThis.document=oldDocument;
    globalThis.window=oldWindow;
  }
});
