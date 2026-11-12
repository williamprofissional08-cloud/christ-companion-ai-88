import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("study checkpoint never lowers a user's saved reading percentage", async () => {
  const source = await readFile(
    new URL("../src/lib/study-progress.functions.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /\.eq\("user_id", context\.userId\)/);
  assert.match(source, /\.eq\("study_slug", data\.slug\)/);
  assert.match(source, /Math\.max\(data\.readPercent, existing\?\.read_percent \?\? 0\)/);
  assert.match(source, /onConflict: "user_id,study_slug"/);
  assert.doesNotMatch(source, /completed:\s*true/);
});

test("security migration is review-only, transactional, idempotent and has a rollback", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/20261112170000_harden_security_and_consolidate_rls.sql", import.meta.url),
    "utf8",
  );
  const rollback = await readFile(
    new URL("../supabase/rollback/20261112170000_harden_security_and_consolidate_rls.rollback.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /^BEGIN;/);
  assert.match(migration, /COMMIT;\s*$/);
  assert.match(migration, /DROP POLICY IF EXISTS "service role manages AI rate limits"/);
  assert.match(migration, /DROP POLICY IF EXISTS "service role manages community message rate limits"/);
  assert.equal((migration.match(/SET search_path = pg_catalog, public, auth, pg_temp/g) ?? []).length, 4);
  assert.equal((migration.match(/REVOKE EXECUTE ON FUNCTION public\./g) ?? []).length, 4);
  assert.match(migration, /char_length\(s\.term\) >= 2/);
  assert.match(migration, /greatest\(1, least\(coalesce\(p_limit, 30\), 50\)\)/);
  assert.match(migration, /DROP POLICY IF EXISTS "admins manage courses"/);
  assert.match(migration, /CREATE POLICY "read courses or administer courses"/);
  assert.match(rollback, /^BEGIN;/);
  assert.match(rollback, /CREATE POLICY "admins manage courses"/);
  assert.match(rollback, /COMMIT;\s*$/);
});
