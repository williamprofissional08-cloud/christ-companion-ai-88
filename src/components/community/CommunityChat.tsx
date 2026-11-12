import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Flag, Loader2, MessageCircle, Pencil, Send, ShieldBan, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { authorId, messageText, participantPair, validMessage, type ChatMessage, type Member } from "@/lib/community-chat";

function useChatData() {
  const user = useQuery({ queryKey: ["community-user"], queryFn: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error("Entre novamente para conversar.");
    return data.user;
  } });
  const members = useQuery({ queryKey: ["community-members", user.data?.id], enabled: !!user.data, queryFn: async () => {
    const { data, error } = await supabase.rpc("community_members");
    if (error) throw error;
    return data ?? [];
  } });
  const blocks = useQuery({ queryKey: ["community-blocks", user.data?.id], enabled: !!user.data, queryFn: async () => {
    const { data, error } = await supabase.from("bloqueios").select("bloqueado");
    if (error) throw error;
    return new Set((data ?? []).map(x => x.bloqueado));
  } });
  return { user, members, blocks };
}

function MemberAvatar({ member }: { member?: Member | undefined }) {
  return <Avatar className="size-9 shrink-0"><AvatarImage src={member?.avatar_url ?? undefined} alt="" /><AvatarFallback className="bg-primary-soft text-primary">{(member?.display_name ?? "M").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>;
}

export function CommunityChat({ conversationId, inbox = false }: { conversationId?: string; inbox?: boolean }) {
  const { user, members, blocks } = useChatData();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [online, setOnline] = useState<string[]>([]);
  const [connection, setConnection] = useState("Conectando…");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [older, setOlder] = useState<ChatMessage[]>([]);
  const [more, setMore] = useState(true);
  const [paging, setPaging] = useState(false);
  const [pageError, setPageError] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [report, setReport] = useState<ChatMessage | null>(null);
  const [reason, setReason] = useState("");
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState("");
  const [search, setSearch] = useState("");
  const scroll = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const scope = conversationId ?? "global";
  const key = ["community-messages", user.data?.id, scope];

  const conversation = useQuery({ queryKey: ["community-conversation", user.data?.id, conversationId], enabled: !!conversationId && !!user.data,
    queryFn: async () => { const { data, error } = await supabase.from("conversas").select("*").eq("id", conversationId ?? "").single(); if (error) throw error; return data; } });
  const peerId = conversation.data ? (conversation.data.user_a === user.data?.id ? conversation.data.user_b : conversation.data.user_a) : undefined;
  const peer = members.data?.find(m => m.id === peerId);
  const messages = useQuery({ queryKey: key, enabled: !!user.data && !inbox && (!conversationId || !!conversation.data), queryFn: async (): Promise<ChatMessage[]> => {
    const result = conversationId
      ? await supabase.from("mensagens_privadas").select("*").eq("conversa_id", conversationId).order("criado_em", { ascending: false }).order("id", { ascending: false }).limit(50)
      : await supabase.from("mensagens_globais").select("*").order("criado_em", { ascending: false }).order("id", { ascending: false }).limit(50);
    if (result.error) throw result.error;
    return result.data ?? [];
  } });
  const conversations = useQuery({ queryKey: ["community-inbox", user.data?.id], enabled: !!user.data && inbox, queryFn: async () => {
    const { data, error } = await supabase.from("conversas").select("*").order("criado_em", { ascending: false });
    if (error) throw error;
    return Promise.all((data ?? []).map(async c => {
      const [last, unread] = await Promise.all([
        supabase.from("mensagens_privadas").select("conteudo,criado_em").eq("conversa_id", c.id).order("criado_em", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("mensagens_privadas").select("id", { count: "exact", head: true }).eq("conversa_id", c.id).eq("lida", false).neq("remetente_id", user.data?.id ?? "")
      ]);
      if (last.error || unread.error) throw last.error ?? unread.error;
      return { ...c, last: last.data, unread: unread.count ?? 0 };
    }));
  } });

  useEffect(() => {
    setOlder([]); setMore(true); setPageError(""); nearBottom.current = true;
  }, [scope]);

  useEffect(() => {
    const uid = user.data?.id;
    if (!uid) return;
    const presence = supabase.channel("comunidade", { config: { private: true, presence: { key: uid } } });
    presence.on("presence", { event: "sync" }, () => setOnline(Object.keys(presence.presenceState())));
    presence.subscribe(status => {
      setConnection(status === "SUBSCRIBED" ? "Ao vivo" : status === "CHANNEL_ERROR" || status === "TIMED_OUT" ? "Sem conexão ao vivo" : "Conectando…");
      if (status === "SUBSCRIBED") void presence.track({ online: true });
    });
    const untrack = () => { void presence.untrack(); };
    window.addEventListener("pagehide", untrack);
    return () => { window.removeEventListener("pagehide", untrack); void presence.untrack(); void supabase.removeChannel(presence); };
  }, [user.data?.id]);

  useEffect(() => {
    if (!user.data) return;
    const channel = supabase.channel(`community-chat-${crypto.randomUUID()}`);
    const refresh = () => { void qc.invalidateQueries({ queryKey: ["community-messages"] }); void qc.invalidateQueries({ queryKey: ["community-inbox"] }); };
    if (inbox || conversationId) channel.on("postgres_changes", { event: "*", schema: "public", table: "mensagens_privadas", ...(conversationId ? { filter: `conversa_id=eq.${conversationId}` } : {}) }, refresh);
    else channel.on("postgres_changes", { event: "*", schema: "public", table: "mensagens_globais" }, payload => {
      if (payload.eventType === "UPDATE") setOlder(rows => rows.map(m => m.id === payload.new["id"] ? { ...m, ...payload.new } : m));
      if (payload.eventType === "DELETE") setOlder(rows => rows.filter(m => m.id !== payload.old["id"]));
      refresh();
    });
    channel.on("postgres_changes", { event: "*", schema: "public", table: "bloqueios" }, () => { void qc.invalidateQueries({ queryKey: ["community-blocks"] }); refresh(); });
    channel.subscribe(status => { if (status === "SUBSCRIBED") refresh(); });
    return () => { void supabase.removeChannel(channel); };
  }, [user.data?.id, inbox, conversationId, qc]);

  useEffect(() => {
    if (nearBottom.current) bottom.current?.scrollIntoView({ block: "nearest" });
    if (!conversationId || !messages.data || document.visibilityState !== "visible") return;
    const unread = messages.data.filter(m => !m.lida && m.remetente_id !== user.data?.id).map(m => m.id);
    if (!unread.length) return;
    void supabase.from("mensagens_privadas").update({ lida: true }).in("id", unread).then(({ error }) => { if (error) setPageError("Não foi possível confirmar a leitura."); });
  }, [messages.data, conversationId, user.data?.id]);

  async function loadOlder() {
    if (paging || !more || !messages.data) return;
    const combined = [...messages.data, ...older].sort((a,b) => a.criado_em.localeCompare(b.criado_em) || a.id.localeCompare(b.id));
    const cursor = combined[0];
    if (!cursor) { setMore(false); return; }
    setPaging(true); setPageError("");
    const filter = `criado_em.lt.${cursor.criado_em},and(criado_em.eq.${cursor.criado_em},id.lt.${cursor.id})`;
    const result = conversationId
      ? await supabase.from("mensagens_privadas").select("*").eq("conversa_id", conversationId).or(filter).order("criado_em", { ascending: false }).order("id", { ascending: false }).limit(50)
      : await supabase.from("mensagens_globais").select("*").or(filter).order("criado_em", { ascending: false }).order("id", { ascending: false }).limit(50);
    setPaging(false);
    if (result.error) { setPageError("Não foi possível carregar mensagens anteriores."); return; }
    const height = scroll.current?.scrollHeight ?? 0;
    setOlder(rows => [...rows, ...(result.data ?? [])]); setMore((result.data?.length ?? 0) === 50);
    requestAnimationFrame(() => { if (scroll.current) scroll.current.scrollTop += scroll.current.scrollHeight - height; });
  }

  async function send() {
    if (!user.data || !validMessage(draft) || sending) return;
    setSending(true);
    const result = conversationId
      ? await supabase.from("mensagens_privadas").insert({ conversa_id: conversationId, remetente_id: user.data.id, conteudo: messageText(draft) })
      : await supabase.from("mensagens_globais").insert({ user_id: user.data.id, conteudo: messageText(draft) });
    setSending(false);
    if (result.error) { toast.error("Não foi possível enviar. Verifique a conexão e os bloqueios."); return; }
    setDraft(""); nearBottom.current = true; await qc.invalidateQueries({ queryKey: key });
  }

  async function openPrivate(member: Member) {
    if (!user.data) return;
    const pair = participantPair(user.data.id, member.id);
    const existing = await supabase.from("conversas").select("id").eq("user_a", pair.user_a).eq("user_b", pair.user_b).maybeSingle();
    if (existing.error) { toast.error("Não foi possível abrir a conversa."); return; }
    let id = existing.data?.id;
    if (!id) {
      const created = await supabase.from("conversas").insert(pair).select("id").single();
      id = created.data?.id;
      if (created.error?.code === "23505") { const retry = await supabase.from("conversas").select("id").eq("user_a", pair.user_a).eq("user_b", pair.user_b).single(); id = retry.data?.id; }
    }
    if (!id) { toast.error("Conversa indisponível. Pode haver um bloqueio entre vocês."); return; }
    setSelected(null); await navigate({ to: "/comunidade/privado/$conversaId", params: { conversaId: id } });
  }

  async function toggleBlock(member: Member) {
    if (!user.data) return;
    const blocked = blocks.data?.has(member.id);
    const result = blocked ? await supabase.from("bloqueios").delete().eq("bloqueado", member.id) : await supabase.from("bloqueios").insert({ quem_bloqueou: user.data.id, bloqueado: member.id });
    if (result.error) { toast.error("Não foi possível atualizar o bloqueio."); return; }
    await qc.invalidateQueries({ queryKey: ["community-blocks"] }); await qc.invalidateQueries({ queryKey: ["community-messages"] }); await qc.invalidateQueries({ queryKey: ["community-inbox"] });
    toast.success(blocked ? "Membro desbloqueado." : "Membro bloqueado.");
  }

  const all = [...new Map([...older, ...(messages.data ?? [])].map(m => [m.id, m])).values()].sort((a,b) => a.criado_em.localeCompare(b.criado_em) || a.id.localeCompare(b.id));
  const visible = all.filter(m => !m.apagada && !blocks.data?.has(authorId(m)));
  const error = user.error || members.error || blocks.error || messages.error || conversation.error || conversations.error;
  const loading = user.isPending || members.isPending || blocks.isPending || (inbox ? conversations.isPending : messages.isPending);

  return <section aria-label={inbox ? "Mensagens privadas" : "Chat da comunidade"} className="mx-auto mb-6 max-w-7xl border-b border-border pb-6">
    <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="flex items-center gap-2 text-2xl font-semibold"><MessageCircle className="size-6 text-primary" />{inbox ? "Mensagens privadas" : conversationId ? peer?.display_name ?? "Conversa privada" : "Chat da comunidade"}</h2><p className="mt-1 text-sm text-muted-foreground">{online.length} pessoas online · {connection}</p></div>
      <div className="flex gap-2"><Button variant="outline" size="sm" asChild><Link to="/comunidade"><ArrowLeft className="size-4" />Comunidade</Link></Button>{!inbox && <Button variant="outline" size="sm" asChild><Link to="/comunidade/privado">Privadas</Link></Button>}</div>
    </header>
    {error && <div role="alert" className="mb-3 flex items-center justify-between gap-3 rounded-md border border-destructive p-3 text-sm">Não foi possível carregar a conversa.<Button variant="outline" onClick={() => { void qc.invalidateQueries({ queryKey: ["community-user"] }); void qc.invalidateQueries({ predicate: q => String(q.queryKey[0]).startsWith("community-") }); }}>Tentar novamente</Button></div>}
    {loading && !error ? <p role="status" className="flex items-center gap-2 py-8 text-muted-foreground"><Loader2 className="size-4 animate-spin" />Carregando conversas…</p> : <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="min-w-0">
        {inbox ? <div className="divide-y divide-border">
          {!conversations.data?.length && <p className="py-8 text-muted-foreground">Você ainda não tem conversas privadas.</p>}
          {conversations.data?.slice().sort((a,b) => (b.last?.criado_em ?? b.criado_em).localeCompare(a.last?.criado_em ?? a.criado_em)).map(c => {
            const other = members.data?.find(m => m.id === (c.user_a === user.data?.id ? c.user_b : c.user_a));
            return <Button key={c.id} asChild variant="ghost" className="h-auto w-full justify-start gap-3 rounded-none py-4"><Link to="/comunidade/privado/$conversaId" params={{ conversaId: c.id }}><MemberAvatar member={other} /><span className="min-w-0 flex-1 text-left"><span className="block truncate font-semibold">{other?.display_name ?? "Membro"}</span><span className="block truncate text-xs text-muted-foreground">{blocks.data?.has(other?.id ?? "") ? "Membro bloqueado" : c.last?.conteudo ?? "Nenhuma mensagem"}</span></span>{c.unread > 0 && <span aria-label={`${c.unread} não lidas`} className="rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">{c.unread}</span>}</Link></Button>;
          })}
        </div> : <>
          {conversationId && peer && <Button variant="ghost" size="sm" className="mb-2" onClick={() => setSelected(peer)}><MemberAvatar member={peer} />{peer.display_name ?? "Membro"}</Button>}
          <div ref={scroll} role="log" aria-label="Mensagens" className="h-[420px] overflow-y-auto overscroll-contain rounded-md border border-border bg-card p-3 sm:h-[480px]" onScroll={event => { const el = event.currentTarget; nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100; if (el.scrollTop < 20 && all.length >= 50) void loadOlder(); }}>
            {all.length >= 50 && more && <Button variant="ghost" size="sm" disabled={paging} onClick={() => void loadOlder()} className="mb-3 w-full">{paging ? "Carregando…" : "Mensagens anteriores"}</Button>}
            {!visible.length && <p className="py-8 text-center text-sm text-muted-foreground">{blocks.data?.has(peerId ?? "") ? "Esta conversa está bloqueada." : "Nenhuma mensagem por enquanto."}</p>}
            {visible.map(m => {
              const author = members.data?.find(p => p.id === authorId(m)); const mine = authorId(m) === user.data?.id;
              return <article key={m.id} className={`mb-4 flex gap-2 ${mine ? "flex-row-reverse" : ""}`}><MemberAvatar member={author} /><div className={`min-w-0 max-w-[85%] rounded-md px-3 py-2 ${mine ? "bg-primary-soft" : "bg-muted"}`}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><Button variant="link" className="h-auto min-w-0 max-w-full justify-start whitespace-normal p-0 text-xs" onClick={() => author && setSelected(author)}>{author?.display_name ?? "Membro"}</Button><time className="text-[10px] text-muted-foreground" dateTime={m.criado_em}>{new Date(m.criado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</time></div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{m.conteudo}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1">{mine && !conversationId ? <><Button title="Editar mensagem" aria-label="Editar mensagem" variant="ghost" size="icon" className="size-7" onClick={() => { setEditing(m); setEditText(m.conteudo); }}><Pencil className="size-3" /></Button><Button title="Apagar mensagem" aria-label="Apagar mensagem" variant="ghost" size="icon" className="size-7" onClick={async () => { const { error: e } = await supabase.from("mensagens_globais").update({ apagada: true }).eq("id", m.id); if (e) toast.error("Não foi possível apagar."); else { setOlder(rows => rows.map(x => x.id === m.id ? { ...x, apagada: true } : x)); void qc.invalidateQueries({ queryKey: key }); } }}><Trash2 className="size-3" /></Button></> : !mine && <><Button title="Denunciar mensagem" aria-label="Denunciar mensagem" variant="ghost" size="icon" className="size-7" onClick={() => { setReport(m); setReason(""); }}><Flag className="size-3" /></Button><Button title="Bloquear membro" aria-label="Bloquear membro" variant="ghost" size="icon" className="size-7" onClick={() => author && setSelected(author)}><ShieldBan className="size-3" /></Button></>}{mine && conversationId && <span className="text-[10px] text-muted-foreground">{m.lida ? "Lida" : "Enviada"}</span>}</div>
              </div></article>;
            })}<div ref={bottom} />
          </div>
          {pageError && <p role="alert" className="mt-2 text-sm text-destructive">{pageError}</p>}
          <form className="mt-3 flex items-end gap-2" onSubmit={e => { e.preventDefault(); void send(); }}><div className="min-w-0 flex-1"><Textarea aria-label="Sua mensagem" placeholder="Escreva uma mensagem…" rows={2} value={draft} onChange={e => setDraft(e.target.value)} disabled={!!error || blocks.data?.has(peerId ?? "")} /><p className="mt-1 text-right text-xs text-muted-foreground">{Array.from(messageText(draft)).length}/500</p></div><Button type="submit" size="icon" title="Enviar mensagem" aria-label="Enviar mensagem" disabled={!validMessage(draft) || sending || !!error || blocks.data?.has(peerId ?? "")} className="mb-5 shrink-0">{sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</Button></form>
        </>}
      </div>
      <aside className="min-w-0 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><h3 className="mb-3 flex items-center gap-2 font-semibold"><Users className="size-4 text-primary" />Membros</h3><Input aria-label="Buscar membro" placeholder="Buscar membro" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="mt-3 max-h-72 overflow-y-auto">{members.data?.filter(m => (m.display_name ?? "Membro").toLocaleLowerCase().includes(search.toLocaleLowerCase())).sort((a,b) => Number(online.includes(b.id)) - Number(online.includes(a.id))).map(m => <Button key={m.id} variant="ghost" className="h-auto w-full justify-start gap-2 py-2" onClick={() => setSelected(m)}><MemberAvatar member={m} /><span className="min-w-0 flex-1 truncate text-left text-sm">{m.display_name ?? "Membro"}{m.id === user.data?.id ? " (você)" : ""}</span>{online.includes(m.id) && <span aria-label="Online" className="size-2 shrink-0 rounded-full bg-chart-4" />}</Button>)}</div>
      </aside>
    </div>}
    <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}><DialogContent><DialogHeader><DialogTitle>{selected?.display_name ?? "Membro"}</DialogTitle><DialogDescription>{selected && online.includes(selected.id) ? "Online agora" : "Membro da comunidade"}</DialogDescription></DialogHeader>{selected && selected.id !== user.data?.id && <div className="flex flex-wrap gap-2"><Button disabled={blocks.data?.has(selected.id)} onClick={() => void openPrivate(selected)}><MessageCircle className="size-4" />Conversar em privado</Button><Button variant="outline" onClick={() => void toggleBlock(selected)}><ShieldBan className="size-4" />{blocks.data?.has(selected.id) ? "Desbloquear" : "Bloquear"}</Button></div>}</DialogContent></Dialog>
    <Dialog open={!!report} onOpenChange={open => !open && setReport(null)}><DialogContent><DialogHeader><DialogTitle>Denunciar mensagem</DialogTitle><DialogDescription>A denúncia será visível apenas à equipe de moderação.</DialogDescription></DialogHeader><Textarea aria-label="Motivo da denúncia" value={reason} onChange={e => setReason(e.target.value)} maxLength={1000} /><Button disabled={reason.trim().length < 3} onClick={async () => { if (!report || !user.data) return; const { error: e } = await supabase.from("denuncias").insert({ denunciante_id: user.data.id, mensagem_id: report.id, tipo: conversationId ? "privada" : "global", motivo: reason.trim() }); if (e) toast.error("Não foi possível denunciar."); else { toast.success("Denúncia enviada à moderação."); setReport(null); } }}>Enviar denúncia</Button></DialogContent></Dialog>
    <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>Editar mensagem</DialogTitle><DialogDescription>Sua mensagem no chat global.</DialogDescription></DialogHeader><Textarea aria-label="Texto da mensagem" value={editText} onChange={e => setEditText(e.target.value)} /><Button disabled={!validMessage(editText)} onClick={async () => { if (!editing) return; const { error: e } = await supabase.from("mensagens_globais").update({ conteudo: messageText(editText) }).eq("id", editing.id); if (e) toast.error("Não foi possível editar."); else { setOlder(rows => rows.map(x => x.id === editing.id ? { ...x, conteudo: messageText(editText) } : x)); setEditing(null); void qc.invalidateQueries({ queryKey: key }); } }}>Salvar mensagem</Button></DialogContent></Dialog>
  </section>;
}