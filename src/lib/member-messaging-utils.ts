function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function isConversationUnread(
  lastMessageAt: string | null,
  lastReadAt: string | null,
  lastMessageSenderId: string | null,
  currentUserId: string,
) {
  return Boolean(
    lastMessageAt &&
    lastMessageSenderId &&
    lastMessageSenderId !== currentUserId &&
    (!lastReadAt || new Date(lastMessageAt).getTime() > new Date(lastReadAt).getTime()),
  );
}

export function formatInboxTime(value: string | null, now = new Date()) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === now.toDateString()) return time.format(date);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Ontem";
  if (date.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
  }
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

export function getProfileInitials(name: string | null | undefined) {
  return (name || "Membro")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("pt-BR"))
    .join("");
}

export function filterConversations<
  T extends {
    id: string;
    title: string;
    lastMessagePreview: string | null;
    members: Array<{ display_name: string | null }>;
    unread: boolean;
  },
>(
  conversations: T[],
  query: string,
  filter: "all" | "unread",
  messageConversationIds: string[] = [],
) {
  const term = normalizeSearch(query.trim());
  const messageMatches = new Set(messageConversationIds);
  return conversations.filter((conversation) => {
    if (filter === "unread" && !conversation.unread) return false;
    if (!term) return true;
    const searchText = normalizeSearch(
      `${conversation.title} ${conversation.lastMessagePreview ?? ""} ${conversation.members.map((member) => member.display_name ?? "").join(" ")}`,
    );
    return searchText.includes(term) || messageMatches.has(conversation.id);
  });
}
