import assert from "node:assert/strict";
import test from "node:test";
import {
  COMMUNITY_POST_IMAGE_BUCKET,
  COMMUNITY_POST_IMAGE_MAX_BYTES,
  isCommunityPhoto,
  isMissingCommunityStoryBackend,
} from "../src/lib/community-photo.ts";

test("photo publishing targets the already deployed image bucket", () => {
  assert.equal(COMMUNITY_POST_IMAGE_BUCKET, "community-images");
  assert.ok(COMMUNITY_POST_IMAGE_MAX_BYTES <= 8_388_608);
});

test("community accepts regular iPhone image formats", () => {
  assert.equal(isCommunityPhoto({type:"image/jpeg",name:"photo.jpeg"}),true);
  assert.equal(isCommunityPhoto({type:"image/heic",name:"IMG_4321.HEIC"}),true);
  assert.equal(isCommunityPhoto({type:"",name:"iphone.HEIF"}),true);
  assert.equal(isCommunityPhoto({type:"image/png",name:"image.png"}),true);
  assert.equal(isCommunityPhoto({type:"video/mp4",name:"video.mp4"}),false);
  assert.equal(isCommunityPhoto({type:"application/pdf",name:"receipt.pdf"}),false);
});

test("stories without their database table show the real error", () => {
  assert.equal(isMissingCommunityStoryBackend({code:"PGRST205"}),true);
  assert.equal(isMissingCommunityStoryBackend({code:"42P01"}),true);
  assert.equal(isMissingCommunityStoryBackend({code:"42501"}),false);
});
