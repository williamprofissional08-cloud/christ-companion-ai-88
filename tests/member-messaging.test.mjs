import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  filterConversations,
  formatInboxTime,
  getProfileInitials,
  isConversationUnread,
} from "../src/lib/member-messaging-utils.ts";

const now = new Date("2026-11-12T15:00:00.000Z");

function conversation(id, overrides = {}) {
  return {
    id,
    kind: "direct",
    title: `Pessoa ${id}`,
    avatarUrl: null,
    members: [],
    lastMessagePreview: null,
    lastMessageAt: null,
    lastMessageSenderId: null,
    createdAt: "2026-11-12T14:00:00.000Z",
    lastReadAt: null,
    unread: false,
    ...overrides,
  };
}

test("uma conversa fica não lida apenas quando a última mensagem é nova e veio de outra pessoa", () => {
  assert.equal(
    isConversationUnread("2026-11-12T14:01:00.000Z", "2026-11-12T14:00:00.000Z", "outro", "eu"),
    true,
  );
  assert.equal(
    isConversationUnread("2026-11-12T13:59:00.000Z", "2026-11-12T14:00:00.000Z", "outro", "eu"),
    false,
  );
  assert.equal(
    isConversationUnread("2026-11-12T14:01:00.000Z", "2026-11-12T14:00:00.000Z", "eu", "eu"),
    false,
  );
  assert.equal(isConversationUnread(null, null, null, "eu"), false);
});

test("horários são formatados como hoje, ontem e data curta", () => {
  assert.equal(formatInboxTime("2026-11-12T14:25:00.000Z", now), "14:25");
  assert.equal(formatInboxTime("2026-11-11T14:25:00.000Z", now), "Ontem");
  assert.equal(formatInboxTime("2026-10-20T14:25:00.000Z", now), "20/10");
});

test("iniciais de avatar e busca da caixa ignoram acentos e podem achar mensagens antigas", () => {
  assert.equal(getProfileInitials("Ana Clara Souza"), "AC");
  const conversations = [
    conversation("1", { title: "José", lastMessagePreview: "Vamos orar hoje" }),
    conversation("2", { title: "Ana", lastMessagePreview: "Tudo bem?" }),
  ];
  assert.deepEqual(
    filterConversations(conversations, "jose", "all").map((item) => item.id),
    ["1"],
  );
  assert.deepEqual(
    filterConversations(conversations, "esperança", "all", ["2"]).map((item) => item.id),
    ["2"],
  );
  assert.deepEqual(
    filterConversations([...conversations, conversation("3", { unread: true })], "", "unread").map(
      (item) => item.id,
    ),
    ["3"],
  );
});

test("a migração separa mensagens de membros do chat da IA e limita dados a participantes", async () => {
  const migrationPath = new URL(
    "../supabase/migrations/20261111233000_member_messaging.sql",
    import.meta.url,
  );
  const sql = await readFile(fileURLToPath(migrationPath), "utf8");
  assert.match(sql, /create table if not exists public\.community_conversations/i);
  assert.match(sql, /create table if not exists public\.community_messages/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /sender_id = auth\.uid\(\) and public\.is_community_conversation_member/i);
  assert.match(
    sql,
    /revoke all on table public\.community_messages from public, anon, authenticated/i,
  );
  assert.match(
    sql,
    /grant insert \(conversation_id, sender_id, body\) on table public\.community_messages to authenticated/i,
  );
  assert.match(sql, /mark_community_conversation_read/i);
  assert.doesNotMatch(sql, /grant update \(last_read_at\)/i);
});
