import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("study progress migration is additive and isolates each user's study checkpoint", async () => {
  const sql = await readFile(
    new URL("../supabase/migrations/20261110160000_restore_study_progress.sql", import.meta.url),
    "utf8",
  );

  assert.match(sql, /create table if not exists public\.study_progress/i);
  assert.match(sql, /unique \(user_id, study_slug\)/i);
  assert.match(sql, /read_percent integer not null default 0 check \(read_percent between 0 and 100\)/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /to authenticated[\s\S]*using \(\(select auth\.uid\(\)\) = user_id\)/i);
  assert.match(sql, /with check \(\(select auth\.uid\(\)\) = user_id\)/i);
  assert.match(sql, /revoke all on table public\.study_progress from anon, public/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.study_progress to authenticated/i);
});
