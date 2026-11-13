import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Loader2,
  MessageCircle,
  MessagesSquare,
  Plus,
  Search,
  Send,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { SermonDrafts } from "@/components/messaging/SermonDrafts";
import {
  addGroupConversationMembers,
  createGroupConversation,
  createOrGetDirectConversation,
  filterConversations,
  findCommunityMembers,
  formatInboxTime,
  getCommunityConversationThread,
  getProfileInitials,
  listCommunityConversations,
  markCommunityConversationRead,
  searchCommunityMessageConversationIds,
  sendCommunityMessage,
  subscribeToCommunityMessaging,
  type CommunityProfile,
  type ConversationThread,
  type InboxConversation,
} from "@/lib/member-messaging";

export const Route = createFileRoute("/_authenticated/minhas-mensagens")({
  head: () => ({
    meta: [
      { title: "Minhas mensagens — Caminho Divino" },
      { name: "description", content: "Converse, ore e caminhe junto com sua comunidade." },
      { property: "og:title", content: "Minhas mensagens" },
      { property: "og:description", content: "Converse, ore e caminhe junto com sua comunidade." },
    ],
  }),
  component: MessagesPage,
});

function initialsFallback(name: string | null | undefined) {
  return getProfileInitials(name) || "M";
}

function ProfileAvatar({
  profile,
  name,
  group = false,
  size = "size-12",
}: {
  profile?: CommunityProfile | null | undefined;
  name?: string | null;
  group?: boolean;
  size?: string;
}) {
  return (
    <Avatar className={`${size} shrink-0 border border-border/60 bg-background`}>
      {profile?.avatar_url && !group ? (
        <AvatarImage
          src={profile.avatar_url}
          alt={name || profile.display_name || "Foto do perfil"}
        />
      ) : null}
      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
        {group ? (
          <UsersRound aria-hidden="true" className="size-5" />
        ) : (
          initialsFallback(name || profile?.display_name)
        )}
      </AvatarFallback>
    </Avatar>
  );
}

function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? "";
  const [section, setSection] = useState("conversations");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [newOpen, setNewOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [isMobileThread, setIsMobileThread] = useState(false);

  const inboxKey = useMemo(() => ["community-conversations", userId] as const, [userId]);
  const inbox = useQuery({
    queryKey: inboxKey,
    enabled: Boolean(userId),
    queryFn: () => listCommunityConversations(userId),
    refetchOnWindowFocus: true,
  });
  const messageMatches = useQuery({
    queryKey: ["community-message-search", query, userId],
    enabled: Boolean(userId) && query.trim().length >= 2,
    queryFn: () => searchCommunityMessageConversationIds(query),
    staleTime: 10_000,
  });
  const visibleConversations = useMemo(
    () => filterConversations(inbox.data ?? [], query, filter, messageMatches.data ?? []),
    [inbox.data, query, filter, messageMatches.data],
  );
  const activeConversation =
    (inbox.data ?? []).find((conversation) => conversation.id === activeId) ?? null;

  const thread = useQuery<ConversationThread>({
    queryKey: ["community-conversation-thread", activeId, userId],
    enabled: Boolean(activeId && userId),
    queryFn: () => getCommunityConversationThread(activeId!, userId),
  });
  const threadLoaded = Boolean(thread.data);
  const latestMessageId = thread.data?.messages.at(-1)?.id;

  useEffect(() => {
    if (!userId) return;
    return subscribeToCommunityMessaging(userId, () => {
      void queryClient.invalidateQueries({ queryKey: inboxKey });
      if (activeId)
        void queryClient.invalidateQueries({
          queryKey: ["community-conversation-thread", activeId, userId],
        });
      if (query.trim().length >= 2)
        void queryClient.invalidateQueries({
          queryKey: ["community-message-search", query, userId],
        });
    });
  }, [userId, activeId, query, queryClient, inboxKey]);

  useEffect(() => {
    if (!activeId || !userId || !threadLoaded) return;
    void markCommunityConversationRead(activeId, userId)
      .then(() => queryClient.invalidateQueries({ queryKey: inboxKey }))
      .catch(() => toast.error("Não foi possível atualizar o estado de leitura."));
  }, [activeId, userId, threadLoaded, latestMessageId, queryClient, inboxKey]);

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendCommunityMessage(activeId!, userId, body),
    onSuccess: async () => {
      setDraft("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: inboxKey }),
        queryClient.invalidateQueries({
          queryKey: ["community-conversation-thread", activeId, userId],
        }),
      ]);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a mensagem."),
  });

  const addMembersMutation = useMutation({
    mutationFn: (memberIds: string[]) => addGroupConversationMembers(activeId!, memberIds),
    onSuccess: async () => {
      setAddMembersOpen(false);
      toast.success("Participantes adicionados ao grupo.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: inboxKey }),
        queryClient.invalidateQueries({
          queryKey: ["community-conversation-thread", activeId, userId],
        }),
      ]);
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Não foi possível adicionar participantes.",
      ),
  });

  async function openConversation(conversation: InboxConversation) {
    setActiveId(conversation.id);
    setIsMobileThread(true);
    setSection("conversations");
    await queryClient.invalidateQueries({
      queryKey: ["community-conversation-thread", conversation.id, userId],
    });
  }

  async function onCreated(conversationId: string) {
    setNewOpen(false);
    setActiveId(conversationId);
    setIsMobileThread(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: inboxKey }),
      queryClient.invalidateQueries({
        queryKey: ["community-conversation-thread", conversationId, userId],
      }),
    ]);
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    if (body.length > 2000) {
      toast.error("A mensagem pode ter no máximo 2.000 caracteres.");
      return;
    }
    sendMutation.mutate(body);
  }

  return (
    <AppShell title="Minhas mensagens" subtitle="Converse, ore e caminhe junto com sua comunidade.">
      <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
        <Tabs value={section} onValueChange={setSection}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList className="h-11 rounded-full border border-border/70 bg-card p-1">
              <TabsTrigger value="conversations" className="h-9 rounded-full px-4">
                Conversas
              </TabsTrigger>
              <TabsTrigger value="drafts" className="h-9 rounded-full px-4">
                Esboços
              </TabsTrigger>
            </TabsList>
            {section === "conversations" && !isMobileThread ? (
              <Button onClick={() => setNewOpen(true)} className="rounded-full">
                <Plus aria-hidden="true" className="size-4" /> Nova conversa
              </Button>
            ) : null}
          </div>

          <TabsContent value="drafts" className="mt-5">
            <SermonDrafts />
          </TabsContent>
          <TabsContent value="conversations" className="mt-5">
            {authLoading ? (
              <Card className="flex min-h-64 items-center justify-center rounded-3xl border-border/70">
                <Loader2 className="size-6 animate-spin text-primary" aria-label="Carregando" />
              </Card>
            ) : !user ? (
              <Card className="rounded-3xl border-border/70 p-8 text-center text-muted-foreground">
                Entre na sua conta para conversar com a comunidade.
              </Card>
            ) : (
              <div className="grid min-h-[min(72vh,760px)] overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.4fr)]">
                <aside
                  className={`${isMobileThread ? "hidden lg:flex" : "flex"} min-w-0 flex-col border-border/70 lg:border-r`}
                  aria-label="Caixa de entrada"
                >
                  <div className="border-b border-border/70 p-4 sm:p-5">
                    <div className="relative">
                      <Search
                        aria-hidden="true"
                        className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Buscar mensagens ou pessoas..."
                        aria-label="Buscar mensagens ou pessoas"
                        className="h-11 rounded-2xl pl-9"
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <div
                        className="inline-flex rounded-full bg-muted/70 p-1"
                        aria-label="Filtrar conversas"
                      >
                        <button
                          type="button"
                          onClick={() => setFilter("all")}
                          aria-pressed={filter === "all"}
                          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${filter === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          Todas
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilter("unread")}
                          aria-pressed={filter === "unread"}
                          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${filter === "unread" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          Não lidas
                        </button>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {inbox.data?.length ?? 0}{" "}
                        {inbox.data?.length === 1 ? "conversa" : "conversas"}
                      </span>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
                    {inbox.isLoading ? (
                      <div className="flex justify-center p-8">
                        <Loader2
                          className="size-5 animate-spin text-primary"
                          aria-label="Carregando conversas"
                        />
                      </div>
                    ) : null}
                    {inbox.error ? (
                      <div role="alert" className="p-5 text-center text-sm text-destructive">
                        Não foi possível carregar as conversas. Verifique se a atualização de
                        mensagens está publicada no backend.
                      </div>
                    ) : null}
                    {!inbox.isLoading && !inbox.error && visibleConversations.length === 0 ? (
                      <div className="flex h-full min-h-52 flex-col items-center justify-center gap-3 px-4 text-center">
                        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <MessageCircle aria-hidden="true" className="size-5" />
                        </span>
                        <p className="font-medium text-foreground">
                          {filter === "unread"
                            ? "Nenhuma conversa não lida"
                            : query
                              ? "Nenhuma conversa encontrada"
                              : "Suas conversas começam aqui"}
                        </p>
                        <p className="max-w-xs text-sm text-muted-foreground">
                          {query
                            ? "Tente buscar por outro nome ou trecho de mensagem."
                            : "Inicie uma conversa para caminhar junto com alguém da comunidade."}
                        </p>
                        {!query && filter === "all" ? (
                          <Button
                            variant="outline"
                            onClick={() => setNewOpen(true)}
                            className="mt-1 rounded-full"
                          >
                            <Plus aria-hidden="true" className="size-4" /> Nova conversa
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                    <ul className="space-y-2">
                      {visibleConversations.map((conversation) => (
                        <li key={conversation.id}>
                          <button
                            type="button"
                            onClick={() => void openConversation(conversation)}
                            className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeId === conversation.id ? "border-primary/20 bg-primary/[0.06]" : conversation.unread ? "border-primary/10 bg-primary/[0.035]" : "border-transparent"}`}
                          >
                            <span className="relative">
                              <ProfileAvatar
                                profile={
                                  conversation.members.find(
                                    (member) => member.id !== userId && member.avatar_url,
                                  ) ?? conversation.members.find((member) => member.id !== userId)
                                }
                                name={conversation.title}
                                group={conversation.kind === "group"}
                              />
                              {conversation.unread ? (
                                <span
                                  className="absolute -left-1 top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-primary ring-2 ring-card"
                                  aria-label="Mensagem não lida"
                                />
                              ) : null}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span
                                  className={`truncate text-sm ${conversation.unread ? "font-bold text-foreground" : "font-semibold text-foreground"}`}
                                >
                                  {conversation.title}
                                </span>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                  {formatInboxTime(
                                    conversation.lastMessageAt ?? conversation.createdAt,
                                  )}
                                </span>
                              </span>
                              <span
                                className={`mt-1 block truncate text-sm ${conversation.unread ? "font-medium text-foreground/80" : "text-muted-foreground"}`}
                              >
                                {conversation.lastMessagePreview ||
                                  (conversation.kind === "group"
                                    ? "Grupo criado. Envie a primeira mensagem."
                                    : "Conversa iniciada. Diga olá!")}
                              </span>
                            </span>
                            <ChevronRight
                              aria-hidden="true"
                              className="size-4 shrink-0 text-muted-foreground"
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </aside>

                <section
                  className={`${isMobileThread ? "flex" : "hidden lg:flex"} min-h-[min(72vh,760px)] min-w-0 flex-col`}
                  aria-label="Conversa selecionada"
                >
                  {activeConversation ? (
                    <>
                      <header className="flex items-center gap-3 border-b border-border/70 px-4 py-3 sm:px-5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 lg:hidden"
                          aria-label="Voltar para conversas"
                          onClick={() => setIsMobileThread(false)}
                        >
                          <ArrowLeft aria-hidden="true" className="size-5" />
                        </Button>
                        <ProfileAvatar
                          profile={
                            activeConversation.members.find(
                              (member) => member.id !== userId && member.avatar_url,
                            ) ?? activeConversation.members.find((member) => member.id !== userId)
                          }
                          name={activeConversation.title}
                          group={activeConversation.kind === "group"}
                        />
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate font-semibold text-foreground">
                            {activeConversation.title}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            {activeConversation.kind === "group"
                              ? `${activeConversation.members.length} participantes`
                              : "Conversa privada"}
                          </p>
                        </div>
                        {activeConversation.kind === "group" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAddMembersOpen(true)}
                            className="rounded-full"
                          >
                            <UserPlus aria-hidden="true" className="size-4" />
                            <span className="hidden sm:inline">Adicionar</span>
                          </Button>
                        ) : null}
                      </header>
                      <div
                        className="flex-1 space-y-3 overflow-y-auto bg-muted/15 p-4 sm:p-6"
                        aria-live="polite"
                        aria-relevant="additions text"
                      >
                        {thread.isLoading ? (
                          <div className="flex h-full items-center justify-center">
                            <Loader2
                              className="size-5 animate-spin text-primary"
                              aria-label="Carregando conversa"
                            />
                          </div>
                        ) : null}
                        {thread.error ? (
                          <div
                            role="alert"
                            className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive"
                          >
                            Não foi possível abrir esta conversa. Tente novamente.
                          </div>
                        ) : null}
                        {!thread.isLoading &&
                        !thread.error &&
                        thread.data?.messages.length === 0 ? (
                          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 text-center">
                            <MessagesSquare aria-hidden="true" className="size-8 text-primary/70" />
                            <p className="font-medium">Que bom caminhar com você.</p>
                            <p className="text-sm text-muted-foreground">
                              Envie uma mensagem para começar a conversa.
                            </p>
                          </div>
                        ) : null}
                        {thread.data?.messages.map((message) => {
                          const own = message.sender_id === userId;
                          return (
                            <div
                              key={message.id}
                              className={`flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}
                            >
                              {!own ? (
                                <ProfileAvatar
                                  profile={message.sender}
                                  name={message.sender.display_name}
                                  size="size-8"
                                />
                              ) : null}
                              <div
                                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[75%] ${own ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border/60 bg-card text-foreground"}`}
                              >
                                {activeConversation.kind === "group" && !own ? (
                                  <p className="mb-1 text-xs font-semibold text-primary">
                                    {message.sender.display_name || "Membro"}
                                  </p>
                                ) : null}
                                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                  {message.body}
                                </p>
                                <p
                                  className={`mt-1 text-right text-[10px] ${own ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                                >
                                  {formatInboxTime(message.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <form
                        onSubmit={submitMessage}
                        className="border-t border-border/70 bg-card p-3 sm:p-4"
                      >
                        <div className="flex items-end gap-2">
                          <Textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                event.currentTarget.form?.requestSubmit();
                              }
                            }}
                            placeholder="Escreva sua mensagem..."
                            aria-label="Escreva sua mensagem"
                            maxLength={2000}
                            rows={1}
                            className="max-h-32 min-h-11 resize-y rounded-2xl"
                          />
                          <Button
                            type="submit"
                            size="icon"
                            disabled={!draft.trim() || sendMutation.isPending}
                            aria-label="Enviar mensagem"
                            className="size-11 shrink-0 rounded-full"
                          >
                            {sendMutation.isPending ? (
                              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                            ) : (
                              <Send aria-hidden="true" className="size-4" />
                            )}
                          </Button>
                        </div>
                        <div className="mt-1 flex justify-between px-1 text-[11px] text-muted-foreground">
                          <span>Enter para enviar · Shift+Enter para nova linha</span>
                          <span>{draft.length}/2000</span>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="hidden h-full flex-col items-center justify-center gap-3 px-8 text-center lg:flex">
                      <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <MessagesSquare aria-hidden="true" className="size-7" />
                      </span>
                      <h2 className="font-display text-xl font-semibold">
                        Suas conversas, em um só lugar
                      </h2>
                      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                        Escolha uma conversa ou encontre alguém da comunidade para começar a trocar
                        mensagens.
                      </p>
                      <Button onClick={() => setNewOpen(true)} className="mt-2 rounded-full">
                        <Plus aria-hidden="true" className="size-4" /> Nova conversa
                      </Button>
                    </div>
                  )}
                </section>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <MemberPickerDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        currentUserId={userId}
        title="Nova conversa"
        description="Encontre alguém pelo nome ou escolha pessoas para criar um grupo."
        mode="create"
        onDirect={async (member) => {
          try {
            await onCreated(await createOrGetDirectConversation(member.id));
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Não foi possível iniciar a conversa.",
            );
          }
        }}
        onGroup={async (groupTitle, members) => {
          try {
            await onCreated(
              await createGroupConversation(
                groupTitle,
                members.map((member) => member.id),
              ),
            );
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível criar o grupo.");
          }
        }}
      />
      <MemberPickerDialog
        open={addMembersOpen}
        onOpenChange={setAddMembersOpen}
        currentUserId={userId}
        title="Adicionar participantes"
        description="Selecione pessoas para adicionar a este grupo."
        mode="add"
        excludedIds={activeConversation?.members.map((member) => member.id) ?? []}
        busy={addMembersMutation.isPending}
        onAdd={(members) => addMembersMutation.mutate(members.map((member) => member.id))}
      />
    </AppShell>
  );
}

type PickerMode = "create" | "add";
function MemberPickerDialog({
  open,
  onOpenChange,
  currentUserId,
  title,
  description,
  mode,
  excludedIds = [],
  busy = false,
  onDirect,
  onGroup,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  title: string;
  description: string;
  mode: PickerMode;
  excludedIds?: string[];
  busy?: boolean;
  onDirect?: (member: CommunityProfile) => void;
  onGroup?: (title: string, members: CommunityProfile[]) => void;
  onAdd?: (members: CommunityProfile[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [selected, setSelected] = useState<CommunityProfile[]>([]);
  const [creating, setCreating] = useState(false);
  const [groupMode, setGroupMode] = useState(mode === "add");
  const searchResults = useQuery({
    queryKey: ["community-member-search", currentUserId, search],
    enabled: open && Boolean(currentUserId) && search.trim().length >= 2,
    queryFn: () => findCommunityMembers(search, currentUserId),
    staleTime: 20_000,
  });
  const excluded = useMemo(() => new Set(excludedIds), [excludedIds]);
  const candidates = (searchResults.data ?? []).filter((member) => !excluded.has(member.id));
  const submitting = busy || creating;

  useEffect(() => {
    if (!open) {
      setSearch("");
      setGroupTitle("");
      setSelected([]);
      setCreating(false);
      setGroupMode(mode === "add");
    }
  }, [open, mode]);

  function toggleMember(member: CommunityProfile) {
    setSelected((current) =>
      current.some((item) => item.id === member.id)
        ? current.filter((item) => item.id !== member.id)
        : [...current, member],
    );
  }

  async function submitGroupOrAdd() {
    if (!selected.length) return;
    if (mode === "add") {
      onAdd?.(selected);
      return;
    }
    if (groupTitle.trim().length < 2 || groupTitle.trim().length > 80) {
      toast.error("O nome do grupo deve ter entre 2 e 80 caracteres.");
      return;
    }
    if (selected.length < 2) {
      toast.error("Selecione pelo menos duas pessoas para criar um grupo.");
      return;
    }
    setCreating(true);
    try {
      await onGroup?.(groupTitle.trim(), selected);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto rounded-3xl">
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="font-display text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar pessoas pelo nome..."
            aria-label="Buscar pessoas pelo nome"
            className="rounded-xl pl-9"
            autoFocus
          />
        </div>
        {mode === "create" ? (
          <div className="flex gap-2 rounded-xl bg-muted/50 p-1" aria-label="Tipo de conversa">
            <button
              type="button"
              onClick={() => {
                setGroupMode(false);
                setSelected([]);
              }}
              aria-pressed={!groupMode}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${!groupMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              <MessageCircle aria-hidden="true" className="mr-1.5 inline size-4" /> Privada
            </button>
            <button
              type="button"
              onClick={() => {
                setGroupMode(true);
                setSelected([]);
              }}
              aria-pressed={groupMode}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${groupMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              <UsersRound aria-hidden="true" className="mr-1.5 inline size-4" /> Grupo
            </button>
          </div>
        ) : null}
        {mode === "create" && groupMode ? (
          <div className="space-y-2">
            <label htmlFor="group-title" className="text-sm font-medium">
              Nome do grupo
            </label>
            <Input
              id="group-title"
              value={groupTitle}
              onChange={(event) => setGroupTitle(event.target.value)}
              maxLength={80}
              placeholder="Ex.: Grupo de oração"
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Selecione duas ou mais pessoas para criar um grupo. Para uma pessoa, basta tocar no
              resultado para iniciar uma conversa privada.
            </p>
          </div>
        ) : null}
        {search.trim().length < 2 ? (
          <div className="rounded-2xl bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
            Digite pelo menos 2 letras para procurar membros.
          </div>
        ) : searchResults.isLoading ? (
          <div className="flex justify-center p-6">
            <Loader2 className="size-5 animate-spin text-primary" aria-label="Buscando pessoas" />
          </div>
        ) : searchResults.error ? (
          <div role="alert" className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
            Não foi possível pesquisar membros. Tente novamente.
          </div>
        ) : candidates.length === 0 ? (
          <div className="rounded-2xl bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum membro encontrado com esse nome.
          </div>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-y-auto" aria-label="Resultados de membros">
            {candidates.map((member) => {
              const isSelected = selected.some((item) => item.id === member.id);
              return (
                <li key={member.id}>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      if (mode === "create" && !groupMode) {
                        onDirect?.(member);
                        return;
                      }
                      toggleMember(member);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    <ProfileAvatar profile={member} name={member.display_name} size="size-10" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {member.display_name || "Membro da comunidade"}
                    </span>
                    {isSelected ? (
                      <Check aria-hidden="true" className="size-5 text-primary" />
                    ) : mode === "add" ? (
                      <Plus aria-hidden="true" className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {mode === "add" || groupMode ? (
          <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
            <p className="text-xs text-muted-foreground">{selected.length} selecionado(s)</p>
            <Button
              type="button"
              onClick={() => void submitGroupOrAdd()}
              disabled={
                submitting ||
                !selected.length ||
                (mode === "create" && (!groupMode || selected.length < 2))
              }
              className="rounded-full"
            >
              {submitting ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : mode === "add" ? (
                <UserPlus aria-hidden="true" className="size-4" />
              ) : (
                <UsersRound aria-hidden="true" className="size-4" />
              )}
              {mode === "add" ? "Adicionar" : "Criar grupo"}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
