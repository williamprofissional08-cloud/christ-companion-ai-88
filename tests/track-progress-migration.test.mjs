import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("track progress migration preserves per-user isolation and upsert key", async () => {
  const sql = await readFile(
    new URL("../supabase/migrations/20261110150000_restore_track_progress.sql", import.meta.url),
    "utf8",
  );

  assert.match(sql, /create table if not exists public\.track_progress/i);
  assert.match(sql, /unique \(user_id, track_slug\)/i);
  assert.match(sql, /completed_steps integer\[\] not null default/i);
  assert.match(sql, /checkpoints jsonb not null default/i);
  assert.match(sql, /reviews jsonb not null default/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /auth\.uid\(\)\) = user_id/i);
  assert.match(sql, /revoke all on table public\.track_progress from anon, public/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.track_progress to authenticated/i);
});
