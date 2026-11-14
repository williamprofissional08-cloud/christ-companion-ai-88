import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const config = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");

test("browser Supabase URL and publishable key are pinned to one project", () => {
  const url = config.match(/const publicBackendUrl = "([^"]+)";/);
  const key = config.match(/const publicBackendKey = "([^"]+)";/);
  assert.ok(url, "Fixed URL must be declared");
  assert.ok(key, "Fixed publishable key must be declared");
  assert.equal(url[1], "https://uluumebztnrgpyzohqrv.supabase.co");
  assert.ok(key[1].startsWith("sb_publishable_"), "Expected a publishable key");
  assert.ok(key[1].endsWith("onvq"), "Unexpected publishable key suffix");
  assert.match(config, /process\.env\["VITE_SUPABASE_URL"\] = publicBackendUrl;/);
  assert.match(config, /process\.env\["VITE_SUPABASE_PUBLISHABLE_KEY"\] = publicBackendKey;/);
  assert.match(config, /"import\.meta\.env\.VITE_SUPABASE_URL": JSON\.stringify\(publicBackendUrl\)/);
  assert.match(config, /"import\.meta\.env\.VITE_SUPABASE_PUBLISHABLE_KEY": JSON\.stringify\(publicBackendKey\)/);
  assert.doesNotMatch(config, /loadEnv|publicEnv|process\.env\["VITE_SUPABASE_(?:URL|PUBLISHABLE_KEY)"\]\s*\|\|=/);
  assert.doesNotMatch(config, /sb_secret_|service_role/i);
});
