import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  filterConversations,
  formatInboxTime,
  getProfileInitials,
  isConversationUnread,
} from "@/lib/member-messaging-utils";

export { filterConversations, formatInboxTime, getProfileInitials, isConversationUnread };

const db = supabase as unknown as SupabaseClient;

export type CommunityProfile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type ConversationKind = "direct" | "group";

export type InboxConversation = {
  id: string;
  kind: ConversationKind;
  title: string;
  avatarUrl: string | null;
  members: CommunityProfile[];
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  lastMessageSenderId: string | null;
  createdAt: string;
  lastReadAt: string | null;
  unread: boolean;
};

export type ConversationMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender: CommunityProfile;
};

export type ConversationThread = {
  id: string;
  kind: ConversationKind;
  title: string;
  createdAt: string;
  members: CommunityProfile[];
  messages: ConversationMessage[];
};

type ConversationRecord = {
  id: string;
  kind: ConversationKind;
  title: string | null;
  created_at: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  last_message_sender_id: string | null;
};

type OwnMembershipRecord = {
  conversation_id: string;
  last_read_at: string | null;
  conversation: ConversationRecord | null;
};

type MembershipRecord = { conversation_id: string; user_id: string };

type MessageRecord = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

async function getProfilesById(ids: string[]) {
  const uniqueIds = [...new Set(ids)];
  if (!uniqueIds.length) return new Map<string, CommunityProfile>();
  const { data, error } = await db
    .from("community_member_profiles")
    .select("id,display_name,avatar_url")
    .in("id", uniqueIds);
  if (error) throw error;
  return new Map(
    ((data ?? []) as unknown as CommunityProfile[]).map((profile) => [profile.id, profile]),
  );
}

export async function listCommunityConversations(
  currentUserId: string,
): Promise<InboxConversation[]> {
  const { data, error } = await db
    .from("community_conversation_members")
    .select(
      "conversation_id,last_read_at,conversation:community_conversations!inner(id,kind,title,created_at,last_message_preview,last_message_at,last_message_sender_id)",
    )
    .eq("user_id", currentUserId)
    .limit(100);
  if (error) throw error;

  const ownRows = (data ?? []) as unknown as OwnMembershipRecord[];
  const rows = ownRows.filter((row) => row.conversation);
  const conversationIds = rows.map((row) => row.conversation_id);
  if (!conversationIds.length) return [];

  const { data: memberData, error: memberError } = await db
    .from("community_conversation_members")
    .select("conversation_id,user_id")
    .in("conversation_id", conversationIds);
  if (memberError) throw memberError;
  const membersByConversation = new Map<string, string[]>();
  for (const member of (memberData ?? []) as unknown as MembershipRecord[]) {
    const members = membersByConversation.get(member.conversation_id) ?? [];
    members.push(member.user_id);
    membersByConversation.set(member.conversation_id, members);
  }
  const allMemberIds = [...new Set([...membersByConversation.values()].flat())];
  const profiles = await getProfilesById(allMemberIds);

  return rows
    .map((row) => {
      const conversation = row.conversation!;
      const members = (membersByConversation.get(conversation.id) ?? []).map(
        (id) => profiles.get(id) ?? { id, display_name: null, avatar_url: null },
      );
      const otherMembers = members.filter((member) => member.id !== currentUserId);
      const title =
        conversation.kind === "direct"
          ? otherMembers[0]?.display_name?.trim() || "Membro da comunidade"
          : conversation.title?.trim() ||
            otherMembers.map((member) => member.display_name || "Membro").join(", ");
      return {
        id: conversation.id,
        kind: conversation.kind,
        title,
        avatarUrl: conversation.kind === "direct" ? (otherMembers[0]?.avatar_url ?? null) : null,
        members,
        lastMessagePreview: conversation.last_message_preview,
        lastMessageAt: conversation.last_message_at,
        lastMessageSenderId: conversation.last_message_sender_id,
        createdAt: conversation.created_at,
        lastReadAt: row.last_read_at,
        unread: isConversationUnread(
          conversation.last_message_at,
          row.last_read_at,
          conversation.last_message_sender_id,
          currentUserId,
        ),
      } satisfies InboxConversation;
    })
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt ?? b.createdAt).getTime() -
        new Date(a.lastMessageAt ?? a.createdAt).getTime(),
    );
}

export async function findCommunityMembers(
  query: string,
  currentUserId: string,
): Promise<CommunityProfile[]> {
  const term = query.trim();
  if (term.length < 2) return [];
  const pattern = term.replace(/[\\%_]/g, "\\$&");
  const { data, error } = await db
    .from("community_member_profiles")
    .select("id,display_name,avatar_url")
    .neq("id", currentUserId)
    .ilike("display_name", `%${pattern}%`)
    .limit(20);
  if (error) throw error;
  return (data ?? []) as unknown as CommunityProfile[];
}

export async function searchCommunityMessageConversationIds(query: string): Promise<string[]> {
  const term = query.trim();
  if (term.length < 2) return [];
  const pattern = term.replace(/[\\%_]/g, "\\$&");
  const { data, error } = await db
    .from("community_messages")
    .select("conversation_id")
    .ilike("body", `%${pattern}%`)
    .limit(200);
  if (error) throw error;
  return [
    ...new Set(
      ((data ?? []) as unknown as Array<{ conversation_id: string }>).map(
        (row) => row.conversation_id,
      ),
    ),
  ];
}

export async function getCommunityConversationThread(
  conversationId: string,
  currentUserId: string,
): Promise<ConversationThread> {
  const [conversationResult, memberResult, messageResult] = await Promise.all([
    db
      .from("community_conversations")
      .select("id,kind,title,created_at")
      .eq("id", conversationId)
      .maybeSingle(),
    db
      .from("community_conversation_members")
      .select("conversation_id,user_id")
      .eq("conversation_id", conversationId),
    db
      .from("community_messages")
      .select("id,conversation_id,sender_id,body,created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (conversationResult.error) throw conversationResult.error;
  if (memberResult.error) throw memberResult.error;
  if (messageResult.error) throw messageResult.error;
  if (!conversationResult.data) throw new Error("Conversa não encontrada ou acesso não permitido.");

  const members = (memberResult.data ?? []) as unknown as MembershipRecord[];
  const messages = (messageResult.data ?? []) as unknown as MessageRecord[];
  const profiles = await getProfilesById([
    ...members.map((member) => member.user_id),
    ...messages.map((message) => message.sender_id),
  ]);
  const memberProfiles = members.map(
    (member) =>
      profiles.get(member.user_id) ?? { id: member.user_id, display_name: null, avatar_url: null },
  );
  const conversation = conversationResult.data as unknown as {
    id: string;
    kind: ConversationKind;
    title: string | null;
    created_at: string;
  };
  const otherMembers = memberProfiles.filter((member) => member.id !== currentUserId);
  const threadTitle =
    conversation.kind === "group"
      ? (conversation.title ?? "Conversa em grupo")
      : otherMembers[0]?.display_name?.trim() || "Membro da comunidade";

  return {
    id: conversation.id,
    kind: conversation.kind,
    title: threadTitle,
    createdAt: conversation.created_at,
    members: memberProfiles,
    messages: messages.reverse().map((message) => ({
      ...message,
      sender: profiles.get(message.sender_id) ?? {
        id: message.sender_id,
        display_name: null,
        avatar_url: null,
      },
    })),
  };
}

export async function createOrGetDirectConversation(otherUserId: string): Promise<string> {
  const { data, error } = await db.rpc("get_or_create_community_direct_conversation", {
    _other_user_id: otherUserId,
  });
  if (error) throw error;
  if (typeof data !== "string") throw new Error("Não foi possível abrir a conversa.");
  return data;
}

export async function createGroupConversation(title: string, memberIds: string[]): Promise<string> {
  const { data, error } = await db.rpc("create_community_group_conversation", {
    _title: title,
    _member_ids: memberIds,
  });
  if (error) throw error;
  if (typeof data !== "string") throw new Error("Não foi possível criar o grupo.");
  return data;
}

export async function addGroupConversationMembers(conversationId: string, memberIds: string[]) {
  const { error } = await db.rpc("add_community_conversation_members", {
    _conversation_id: conversationId,
    _member_ids: memberIds,
  });
  if (error) throw error;
}

export async function sendCommunityMessage(conversationId: string, senderId: string, body: string) {
  const normalized = body.trim();
  if (!normalized || normalized.length > 2000) {
    throw new Error("A mensagem deve ter entre 1 e 2.000 caracteres.");
  }
  const { error } = await db.from("community_messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    body: normalized,
  });
  if (error) throw error;
}

export async function markCommunityConversationRead(conversationId: string, userId: string) {
  const { data: authData, error: authError } = await db.auth.getUser();
  if (authError) throw authError;
  if (authData.user?.id !== userId) throw new Error("Sessão alterada; entre novamente.");
  const { error } = await db.rpc("mark_community_conversation_read", {
    _conversation_id: conversationId,
  });
  if (error) throw error;
}

export function subscribeToCommunityMessaging(userId: string, onChange: () => void) {
  const channel = db
    .channel(`community-messaging:${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "community_conversations" },
      onChange,
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "community_conversation_members",
        filter: `user_id=eq.${userId}`,
      },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "community_messages" },
      onChange,
    )
    .subscribe();
  return () => {
    void db.removeChannel(channel);
  };
}
