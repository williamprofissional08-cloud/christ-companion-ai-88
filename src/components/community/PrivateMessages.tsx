import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ArrowLeft, Flag, Loader2, MessageCircle, Search, Send, ShieldBan, UserRound } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient;
type Member = { id: string; display_name: string | null; avatar_url: string | null };
type Conversation = { id: string; user_a: string; user_b: string; criado_em: string };
type FriendRequest = { id: string; solicitante_id: string; destinatario_id: string; status: "pendente" | "aceito" | "recusado" };
type PrivateMessage = { id: string; conversa_id: string; remetente_id: string; conteudo: string; lida: boolean; criado_em: string };
type ConversationPreview = { conversation: Conversation; member: Member | undefined; lastMessage: PrivateMessage | null; unread: number };
const sanitize = (value: string) => value.replace(/<[^>]*>/g, "").split("").filter((character) => { const code = character.charCodeAt(0); return code >= 32 && code !== 127; }).join("").trim();
const initials = (value?: string | null) => (value || "Membro").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

async function sendProfileReport(reporterId: string, profileId: string) {
  const motivo = window.prompt("Por que deseja denunciar este perfil?");
  if (!motivo?.trim()) return;
  const { error } = await db.from("denuncias").insert({
    denunciante_id: reporterId, perfil_denunciado_id: profileId, mensagem_id: null,
    tipo: "privada", motivo: sanitize(motivo).slice(0, 500),
  });
  if (error) toast.error("Não foi possível enviar a denúncia.");
  else toast.success("Denúncia enviada à moderação.");
}

async function blockMember(blockerId: string, blockedId: string) {
  const confirmed = window.confirm("Bloquear este membro? As mensagens privadas entre vocês ficarão indisponíveis.");
  if (!confirmed) return false;
  const { error } = await db.from("bloqueios").insert({ quem_bloqueou: blockerId, bloqueado: blockedId });
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    toast.error("Não foi possível bloquear este membro.");
    return false;
  }
  toast.success("Membro bloqueado.");
  return true;
}

export function PrivateMessagesList() {
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [previews, setPreviews] = useState<ConversationPreview[]>([]);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);

  const reload = useCallback(async (current: User) => {
    const [{ data: conversations, error: conversationsError }, { data: blocks }] = await Promise.all([
      db.from("conversas").select("id,user_a,user_b,criado_em")
        .or(`user_a.eq.${current.id},user_b.eq.${current.id}`).order("criado_em", { ascending: false }),
      db.from("bloqueios").select("bloqueado").eq("quem_bloqueou", current.id),
    ]);
    if (conversationsError) {
      setError("Não foi possível carregar suas conversas.");
      return;
    }
    const blocked = ((blocks || []) as { bloqueado: string }[]).map((item) => item.bloqueado);
    setBlockedIds(blocked);
    const [{ data: friendships }, { data: requests }] = await Promise.all([
      db.from("amizades").select("user_a,user_b").or("user_a.eq." + current.id + ",user_b.eq." + current.id),
      db.from("pedidos_amizade").select("id,solicitante_id,destinatario_id,status").or("solicitante_id.eq." + current.id + ",destinatario_id.eq." + current.id).eq("status", "pendente"),
    ]);
    const friends = ((friendships || []) as { user_a: string; user_b: string }[]).map((row) => row.user_a === current.id ? row.user_b : row.user_a);
    setFriendIds(friends);
    const requestRows = (requests || []) as FriendRequest[];
    setIncomingRequests(requestRows.filter((row) => row.destinatario_id === current.id));
    setOutgoingRequests(requestRows.filter((row) => row.solicitante_id === current.id));
    const rows = (conversations || []) as Conversation[];
    const otherIds = [...new Set(rows.map((row) => row.user_a === current.id ? row.user_b : row.user_a))];
    const { data: people } = await db.from("community_member_profiles").select("id,display_name,avatar_url").in("id", otherIds.length ? otherIds : ["00000000-0000-0000-0000-000000000000"]);
    const profileMap = Object.fromEntries(((people || []) as Member[]).map((person) => [person.id, person]));
    const visibleRows = rows.filter((row) => !blocked.includes(row.user_a === current.id ? row.user_b : row.user_a));
    const data = await Promise.all(visibleRows.map(async (conversation) => {
      const otherId = conversation.user_a === current.id ? conversation.user_b : conversation.user_a;
      const [{ data: last }, { count }] = await Promise.all([
        db.from("mensagens_privadas").select("id,conversa_id,remetente_id,conteudo,lida,criado_em")
          .eq("conversa_id", conversation.id).order("criado_em", { ascending: false }).limit(1),
        db.from("mensagens_privadas").select("id", { count: "exact", head: true })
          .eq("conversa_id", conversation.id).eq("lida", false).neq("remetente_id", current.id),
      ]);
      return { conversation, member: profileMap[otherId], lastMessage: ((last || [])[0] || null) as PrivateMessage | null, unread: count || 0 };
    }));
    setPreviews(data);
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;
    void db.auth.getUser().then(async ({ data }) => {
      if (!active || !data.user) return;
      setUser(data.user);
      const { data: people, error: peopleError } = await db.from("community_member_profiles")
        .select("id,display_name,avatar_url").neq("id", data.user.id).order("display_name").limit(100);
      if (!active) return;
      if (peopleError) setError("Não foi possível carregar os membros.");
      else setMembers((people || []) as Member[]);
      await reload(data.user);
      if (active) setLoading(false);
    }).catch(() => { if (active) { setError("Não foi possível validar sua sessão."); setLoading(false); } });
    return () => { active = false; };
  }, [reload]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const channel = db.channel(`privadas-lista-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mensagens_privadas" }, () => {
        if (active) void reload(user);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversas" }, () => {
        if (active) void reload(user);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos_amizade" }, () => {
        if (active) void reload(user);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "amizades" }, () => {
        if (active) void reload(user);
      }).subscribe();
    return () => { active = false; void db.removeChannel(channel); };
  }, [user, reload]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return members.filter((member) => member.id !== user?.id && !blockedIds.includes(member.id) &&
      (!query || (member.display_name || "Membro").toLocaleLowerCase("pt-BR").includes(query))).slice(0, 12);
  }, [members, search, blockedIds, user?.id]);

  async function sendFriendRequest(member: Member) {
    if (!user || starting) return;
    setStarting(member.id);
    const { error: requestError } = await db.from("pedidos_amizade").insert({
      solicitante_id: user.id, destinatario_id: member.id,
    });
    setStarting(null);
    if (requestError) {
      toast.error(requestError.code === "23505" ? "Já existe um pedido pendente ou vocês já são amigos." : "Não foi possível enviar o pedido de amizade.");
      return;
    }
    toast.success("Pedido de amizade enviado.");
    await reload(user);
  }

  async function acceptFriendRequest(request: FriendRequest) {
    if (!user || request.destinatario_id !== user.id || starting) return;
    setStarting(request.solicitante_id);
    const { error: acceptError } = await db.from("pedidos_amizade")
      .update({ status: "aceito" }).eq("id", request.id).eq("status", "pendente");
    setStarting(null);
    if (acceptError) { toast.error("Não foi possível aceitar o pedido."); return; }
    toast.success("Amizade aceita. A conversa privada está liberada.");
    await reload(user);
  }

  async function rejectFriendRequest(request: FriendRequest) {
    if (!user || request.destinatario_id !== user.id || starting) return;
    setStarting(request.solicitante_id);
    const { error: rejectError } = await db.from("pedidos_amizade")
      .update({ status: "recusado" }).eq("id", request.id).eq("status", "pendente");
    setStarting(null);
    if (rejectError) { toast.error("Não foi possível recusar o pedido."); return; }
    toast.success("Pedido de amizade recusado.");
    await reload(user);
  }

  async function openConversation(member: Member) {
    if (!user || starting) return;
    if (!friendIds.includes(member.id)) {
      toast.error("Envie um pedido de amizade e aguarde o aceite para conversar no privado.");
      return;
    }
    setStarting(member.id);
    const [userA, userB] = [user.id, member.id].sort();
    let conversation: Conversation | null = null;
    const { data: existing } = await db.from("conversas").select("id,user_a,user_b,criado_em")
      .eq("user_a", userA).eq("user_b", userB).maybeSingle();
    if (existing) conversation = existing as Conversation;
    else {
      const { error: insertError } = await db.from("conversas").insert({ user_a: userA, user_b: userB });
      if (insertError && !insertError.message.toLowerCase().includes("duplicate")) {
        toast.error("Não foi possível iniciar a conversa. Confirme a amizade e verifique se não há bloqueio.");
        setStarting(null);
        return;
      }
      const { data: created } = await db.from("conversas").select("id,user_a,user_b,criado_em")
        .eq("user_a", userA).eq("user_b", userB).maybeSingle();
      conversation = created as Conversation | null;
    }
    setStarting(null);
    if (conversation) window.location.href = "/comunidade/privado/" + conversation.id;
    else toast.error("A conversa não pôde ser aberta. Verifique se não há bloqueio entre as contas.");
  }

  return (
    <AppShell title="Mensagens privadas" subtitle="Conversas pessoais com outros membros">
      <div className="mx-auto max-w-5xl space-y-5 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/comunidade" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="size-4" /> Voltar à Comunidade</Link>
          <span className="text-xs text-muted-foreground">Suas conversas são privadas</span>
        </div>
        <Card className="rounded-2xl border-primary/15 p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center gap-2"><UserRound className="size-5 text-primary" /><h2 className="font-display text-lg font-semibold">Encontrar membros</h2></div>
          <div className="relative mb-3"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar pelo nome..." className="pl-9" /></div>
          {incomingRequests.length > 0 ? <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3"><h3 className="mb-2 text-sm font-semibold">Pedidos recebidos ({incomingRequests.length})</h3><div className="space-y-2">{incomingRequests.map((request) => { const sender = members.find((item) => item.id === request.solicitante_id); return <div key={request.id} className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate text-sm">{sender?.display_name || "Membro da comunidade"}</span><Button size="sm" disabled={starting !== null} onClick={() => void acceptFriendRequest(request)}>{starting === request.solicitante_id ? <Loader2 className="size-4 animate-spin" /> : "Aceitar"}</Button><Button size="sm" variant="ghost" disabled={starting !== null} onClick={() => void rejectFriendRequest(request)}>Recusar</Button></div>; })}</div></div> : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {filteredMembers.map((member) => <div key={member.id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
              <Avatar className="size-10"><AvatarImage src={member.avatar_url ?? undefined} /><AvatarFallback>{initials(member.display_name)}</AvatarFallback></Avatar>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{member.display_name || "Membro"}</span>
              <Button size="sm" variant="outline" disabled={starting !== null || outgoingRequests.some((request) => request.destinatario_id === member.id)} onClick={() => friendIds.includes(member.id) ? void openConversation(member) : incomingRequests.some((request) => request.solicitante_id === member.id) ? void acceptFriendRequest(incomingRequests.find((request) => request.solicitante_id === member.id)!) : void sendFriendRequest(member)}>{starting === member.id ? <Loader2 className="size-4 animate-spin" /> : friendIds.includes(member.id) ? <><MessageCircle className="mr-1 size-3.5" /> Conversar</> : incomingRequests.some((request) => request.solicitante_id === member.id) ? "Aceitar pedido" : outgoingRequests.some((request) => request.destinatario_id === member.id) ? "Pedido enviado" : "Adicionar amigo"}</Button>
              {user ? <div className="flex gap-1"><Button size="icon" variant="ghost" aria-label="Denunciar perfil" onClick={() => void sendProfileReport(user.id, member.id)}><Flag className="size-4" /></Button><Button size="icon" variant="ghost" aria-label="Bloquear membro" onClick={() => void blockMember(user.id, member.id)}><ShieldBan className="size-4" /></Button></div> : null}
            </div>)}
            {!loading && !filteredMembers.length ? <p className="col-span-full py-4 text-center text-sm text-muted-foreground">Nenhum membro encontrado.</p> : null}
          </div>
        </Card>
        <Card className="rounded-2xl border-primary/15 p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Suas conversas</h2>
          {loading ? <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Carregando conversas...</div> : null}
          {!loading && error ? <div className="rounded-xl bg-destructive/5 p-4 text-sm text-destructive">{error}<Button size="sm" variant="outline" className="ml-2" onClick={() => user && void reload(user)}>Tentar novamente</Button></div> : null}
          {!loading && !error && !previews.length ? <div className="py-10 text-center"><MessageCircle className="mx-auto mb-2 size-9 text-primary/40" /><p className="font-medium">Você ainda não tem conversas.</p><p className="mt-1 text-sm text-muted-foreground">Escolha um membro acima para iniciar uma conversa privada.</p></div> : null}
          <div className="divide-y divide-border/60">
            {previews.map(({ conversation, member, lastMessage, unread }) => <a key={conversation.id} href={`/comunidade/privado/${conversation.id}`} className="flex items-center gap-3 py-3 transition hover:bg-muted/30">
              <Avatar className="size-11"><AvatarImage src={member?.avatar_url ?? undefined} /><AvatarFallback>{initials(member?.display_name)}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{member?.display_name || "Membro"}</p><p className="truncate text-xs text-muted-foreground">{lastMessage?.conteudo || "Conversa iniciada"}</p></div>
              <div className="flex flex-col items-end gap-1"><time className="text-[10px] text-muted-foreground">{lastMessage ? new Date(lastMessage.criado_em).toLocaleDateString("pt-BR") : ""}</time>{unread ? <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span> : null}</div>
            </a>)}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

export function PrivateConversationView({ conversaId }: { conversaId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async (current: User) => {
    const { data: conversation, error: conversationError } = await db.from("conversas")
      .select("id,user_a,user_b,criado_em").eq("id", conversaId).single();
    if (conversationError || !conversation) {
      setError("Conversa não encontrada ou indisponível.");
      return;
    }
    const row = conversation as Conversation;
    const otherId = row.user_a === current.id ? row.user_b : row.user_a;
    if (![row.user_a, row.user_b].includes(current.id)) {
      setError("Você não tem acesso a esta conversa.");
      return;
    }
    const [{ data, error: messagesError }, { data: people }] = await Promise.all([
      db.from("mensagens_privadas").select("id,conversa_id,remetente_id,conteudo,lida,criado_em")
        .eq("conversa_id", conversaId).order("criado_em", { ascending: true }).limit(200),
      db.from("community_member_profiles").select("id,display_name,avatar_url").eq("id", otherId).maybeSingle(),
    ]);
    if (messagesError) { setError("Não foi possível carregar as mensagens. Talvez exista um bloqueio ativo."); return; }
    setMessages((data || []) as PrivateMessage[]);
    setMember((people || null) as Member | null);
    await db.from("mensagens_privadas").update({ lida: true })
      .eq("conversa_id", conversaId).eq("lida", false).neq("remetente_id", current.id);
    setError(null);
  }, [conversaId]);

  useEffect(() => {
    let active = true;
    void db.auth.getUser().then(async ({ data }) => {
      if (!active || !data.user) return;
      setUser(data.user);
      await loadMessages(data.user);
      if (active) setLoading(false);
    }).catch(() => { if (active) { setError("Não foi possível validar sua sessão."); setLoading(false); } });
    return () => { active = false; };
  }, [loadMessages]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const channel = db.channel(`privada-${conversaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mensagens_privadas", filter: `conversa_id=eq.${conversaId}` }, () => {
        if (active) void loadMessages(user);
      }).subscribe();
    return () => { active = false; void db.removeChannel(channel); };
  }, [user, conversaId, loadMessages]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || sending) return;
    const conteudo = sanitize(draft);
    if (!conteudo || conteudo.length > 500) { toast.error("A mensagem deve ter até 500 caracteres."); return; }
    setSending(true);
    const { error: sendError } = await db.from("mensagens_privadas").insert({ conversa_id: conversaId, remetente_id: user.id, conteudo });
    setSending(false);
    if (sendError) { toast.error(sendError.message.includes("2 segundos") ? "Aguarde 2 segundos antes de enviar." : "Não foi possível enviar. Verifique se a conversa continua disponível."); return; }
    setDraft("");
    await loadMessages(user);
  }

  async function report(message: PrivateMessage) {
    const motivo = window.prompt("Explique brevemente o motivo da denúncia:");
    if (!motivo?.trim() || !user) return;
    const { error: reportError } = await db.from("denuncias").insert({
      denunciante_id: user.id, mensagem_id: message.id, tipo: "privada", motivo: sanitize(motivo).slice(0, 500),
    });
    if (reportError) toast.error("Não foi possível enviar a denúncia.");
    else toast.success("Denúncia enviada à moderação.");
  }

  async function block() {
    if (!user || !member) return;
    if (await blockMember(user.id, member.id)) window.location.href = "/comunidade/privado";
  }

  return (
    <AppShell title={member?.display_name || "Conversa privada"} subtitle="Somente você e este membro podem ler as mensagens">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 pb-6">
        <div className="flex items-center justify-between gap-2">
          <Link to="/comunidade/privado" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><ArrowLeft className="size-4" /> Todas as conversas</Link>
          <Link to="/comunidade" className="text-xs text-muted-foreground hover:text-primary">Comunidade</Link>
        </div>
        <Card className="flex min-h-[70vh] flex-col overflow-hidden rounded-2xl border-primary/15 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border/60 p-4">
            <Avatar className="size-11"><AvatarImage src={member?.avatar_url ?? undefined} /><AvatarFallback>{initials(member?.display_name)}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{member?.display_name || "Membro"}</h2><p className="text-xs text-muted-foreground">Conversa privada</p></div>
            {user && member ? <><Button size="icon" variant="ghost" aria-label="Denunciar perfil" onClick={() => void sendProfileReport(user.id, member.id)}><Flag className="size-4" /></Button><Button size="icon" variant="ghost" aria-label="Bloquear membro" onClick={() => void block()}><ShieldBan className="size-4" /></Button></> : null}
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
            {loading ? <div className="flex justify-center py-10 text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" />Carregando conversa...</div> : null}
            {!loading && error ? <div className="rounded-xl bg-destructive/5 p-4 text-sm text-destructive">{error}<div className="mt-3"><Button size="sm" variant="outline" onClick={() => user && void loadMessages(user)}>Tentar novamente</Button></div></div> : null}
            {!loading && !error && !messages.length ? <div className="py-16 text-center"><MessageCircle className="mx-auto mb-3 size-9 text-primary/40" /><p className="font-medium">Esta conversa está vazia.</p><p className="mt-1 text-sm text-muted-foreground">Envie uma mensagem para começar.</p></div> : null}
            {messages.map((message) => {
              const mine = message.remetente_id === user?.id;
              return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 ${mine ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-800 dark:bg-muted dark:text-foreground"}`}>
                  <p className="whitespace-pre-wrap break-words text-sm">{message.conteudo}</p>
                  <div className={`mt-1 flex items-center justify-end gap-2 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    <time dateTime={message.criado_em}>{new Date(message.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time>
                    {mine ? <span>{message.lida ? "Lida" : "Enviada"}</span> : <><button type="button" onClick={() => void report(message)} className="inline-flex items-center gap-1 hover:underline"><Flag className="size-3" /> Denunciar</button><button type="button" onClick={() => void block()} className="ml-2 inline-flex items-center gap-1 hover:underline"><ShieldBan className="size-3" /> Bloquear</button></>}
                  </div>
                </div>
              </div>;
            })}
          </div>
          <form onSubmit={send} className="border-t border-border/60 bg-slate-50/70 p-3 dark:bg-muted/20 sm:p-4">
            <div className="flex items-end gap-2"><Textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} rows={2} placeholder="Escreva uma mensagem privada..." className="max-h-28 min-h-12 resize-none bg-white dark:bg-background" /><Button type="submit" size="icon" className="size-12 shrink-0 rounded-xl" disabled={!draft.trim() || sending || Boolean(error)} aria-label="Enviar mensagem">{sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</Button></div>
            <div className="mt-1 text-right text-[10px] text-muted-foreground">{draft.length}/500 caracteres</div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
