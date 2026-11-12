import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { Flag, Loader2, MessageCircle, Send, ShieldBan, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient;
type GlobalMessage = { id: string; user_id: string; conteudo: string; criado_em: string; apagada: boolean };
type Member = { id: string; display_name: string | null; avatar_url: string | null };
type PresenceMember = { user_id?: string; nome?: string; avatar_url?: string | null };
const cleanText = (value: string) => value.replace(/<[^>]*>/g, "").replace(/[\u0000-\u001F\u007F]/g, "").trim();
const initials = (value?: string | null) => (value || "Membro").trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

export function GlobalChatPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<GlobalMessage[]>([]);
  const [members, setMembers] = useState<Record<string, Member>>({});
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [online, setOnline] = useState<PresenceMember[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const loadProfiles = useCallback(async (ids: string[]) => {
    const unique = [...new Set(ids)];
    if (!unique.length) return;
    const { data, error: profileError } = await db.from("community_member_profiles")
      .select("id,display_name,avatar_url").in("id", unique);
    if (profileError) return;
    setMembers((current) => ({ ...current, ...Object.fromEntries(((data || []) as Member[]).map((item) => [item.id, item])) }));
  }, []);

  const loadLatest = useCallback(async (currentUserId: string) => {
    const [messagesResult, blocksResult] = await Promise.all([
      db.from("mensagens_globais").select("id,user_id,conteudo,criado_em,apagada")
        .order("criado_em", { ascending: false }).limit(50),
      db.from("bloqueios").select("bloqueado").eq("quem_bloqueou", currentUserId),
    ]);
    if (messagesResult.error) {
      setError("Não foi possível carregar o chat global. Tente novamente.");
      return;
    }
    const blocked = ((blocksResult.data || []) as { bloqueado: string }[]).map((item) => item.bloqueado);
    setBlockedIds(blocked);
    const rows = ((messagesResult.data || []) as GlobalMessage[]).filter((item) => !item.apagada && !blocked.includes(item.user_id)).reverse();
    setMessages(rows);
    setHasMore((messagesResult.data || []).length === 50);
    await loadProfiles(rows.map((item) => item.user_id));
    setError(null);
  }, [loadProfiles]);

  useEffect(() => {
    let active = true;
    void db.auth.getUser().then(async ({ data }) => {
      if (!active || !data.user) return;
      setUser(data.user);
      await loadLatest(data.user.id);
      if (active) setLoading(false);
    }).catch(() => {
      if (active) { setError("Não foi possível validar sua sessão."); setLoading(false); }
    });
    return () => { active = false; };
  }, [loadLatest]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const metadata = user.user_metadata ?? {};
    const displayName = String(metadata["display_name"] ?? metadata["full_name"] ?? metadata["name"] ?? user.email?.split("@")[0] ?? "Membro");
    const avatarUrl = typeof metadata["avatar_url"] === "string" ? metadata["avatar_url"] : typeof metadata["picture"] === "string" ? metadata["picture"] : null;
    const channel = db.channel("comunidade", { config: { presence: { key: user.id } } })
      .on("presence", { event: "sync" }, () => {
        if (!active) return;
        const state = channel.presenceState() as unknown as Record<string, PresenceMember[]>;
        const unique = new Map<string, PresenceMember>();
        Object.values(state).flat().forEach((item) => {
          if (item.user_id) unique.set(item.user_id, item);
        });
        setOnline([...unique.values()]);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "mensagens_globais" }, () => {
        if (active) void loadLatest(user.id);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void channel.track({ user_id: user.id, nome: displayName, avatar_url: avatarUrl, online_at: new Date().toISOString() });
        }
      });
    return () => {
      active = false;
      setOnline([]);
      void db.removeChannel(channel);
    };
  }, [user, loadLatest]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const onlineMembers = useMemo(() => online.filter((item) => item.user_id !== user?.id), [online, user?.id]);
  const myName = String(user?.user_metadata?.["display_name"] ?? user?.user_metadata?.["full_name"] ?? user?.email?.split("@")[0] ?? "Você");

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || sending) return;
    const conteudo = cleanText(draft);
    if (!conteudo || conteudo.length > 500) {
      toast.error("Escreva uma mensagem de até 500 caracteres.");
      return;
    }
    setSending(true);
    const { error: sendError } = await db.from("mensagens_globais").insert({ user_id: user.id, conteudo });
    setSending(false);
    if (sendError) {
      toast.error(sendError.message.includes("2 segundos") ? "Aguarde 2 segundos antes de enviar outra mensagem." : "Não foi possível enviar. Verifique sua conexão e tente novamente.");
      return;
    }
    setDraft("");
    await loadLatest(user.id);
  }

  async function loadOlder() {
    if (loadingMore || !hasMore || !messages.length) return;
    setLoadingMore(true);
    const oldest = messages[0].criado_em;
    const { data, error: olderError } = await db.from("mensagens_globais")
      .select("id,user_id,conteudo,criado_em,apagada").lt("criado_em", oldest)
      .order("criado_em", { ascending: false }).limit(50);
    if (olderError) toast.error("Não foi possível carregar mensagens anteriores.");
    else {
      const rows = ((data || []) as GlobalMessage[]).filter((item) => !item.apagada && !blockedIds.includes(item.user_id)).reverse();
      setMessages((current) => [...rows, ...current]);
      setHasMore((data || []).length === 50);
      await loadProfiles(rows.map((item) => item.user_id));
    }
    setLoadingMore(false);
  }

  async function report(message: GlobalMessage) {
    const motivo = window.prompt("Explique brevemente o motivo da denúncia:");
    if (!motivo?.trim()) return;
    const { error: reportError } = await db.from("denuncias").insert({
      denunciante_id: user?.id, mensagem_id: message.id, tipo: "global", motivo: cleanText(motivo).slice(0, 500),
    });
    if (reportError) toast.error("Não foi possível enviar a denúncia.");
    else toast.success("Denúncia enviada à moderação.");
  }

  async function block(memberId: string) {
    if (!user || memberId === user.id) return;
    const confirmed = window.confirm("Bloquear este membro? As mensagens dele deixarão de aparecer para você e a conversa privada ficará indisponível.");
    if (!confirmed) return;
    const { error: blockError } = await db.from("bloqueios").insert({ quem_bloqueou: user.id, bloqueado: memberId });
    if (blockError && !blockError.message.toLowerCase().includes("duplicate")) toast.error("Não foi possível bloquear este membro.");
    else {
      setBlockedIds((current) => [...new Set([...current, memberId])]);
      setMessages((current) => current.filter((item) => item.user_id !== memberId));
      toast.success("Membro bloqueado.");
    }
  }

  async function removeOwn(message: GlobalMessage) {
    const { error: deleteError } = await db.from("mensagens_globais").update({ apagada: true }).eq("id", message.id).eq("user_id", user?.id);
    if (deleteError) toast.error("Não foi possível apagar a mensagem.");
    else setMessages((current) => current.filter((item) => item.id !== message.id));
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-primary/15 bg-white shadow-sm dark:bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><MessageCircle className="size-5" /></span>
          <div><h2 className="font-display text-lg font-semibold text-[#142d59] dark:text-foreground">Chat global</h2><p className="text-xs text-muted-foreground">Converse com a comunidade em tempo real</p></div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span className="size-2 rounded-full bg-emerald-500" /> {online.length} {online.length === 1 ? "pessoa online" : "pessoas online"}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-border/50 bg-slate-50/70 px-4 py-3 dark:bg-muted/20">
        <UsersRound className="size-4 text-primary" />
        <span className="text-xs font-semibold text-muted-foreground">Online agora:</span>
        {onlineMembers.length ? onlineMembers.slice(0, 8).map((person) => (
          <span key={person.user_id} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-white px-2 py-1 text-xs dark:bg-card">
            <span className="size-1.5 rounded-full bg-emerald-500" />{person.nome || "Membro"}
          </span>
        )) : <span className="text-xs text-muted-foreground">Você está entre os primeiros por aqui.</span>}
        <a href="/comunidade/privado" className="ml-auto text-xs font-semibold text-primary hover:underline">Mensagens privadas →</a>
      </div>
      <div className="max-h-[520px] min-h-[250px] space-y-3 overflow-y-auto p-4 sm:p-5" onScroll={(event) => { if (event.currentTarget.scrollTop <= 24 && !loadingMore && hasMore && !loading) void loadOlder(); }}>
        {loading ? <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Carregando mensagens...</div> : null}
        {!loading && error ? <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}<Button variant="outline" size="sm" className="ml-2" onClick={() => user && void loadLatest(user.id)}>Tentar novamente</Button></div> : null}
        {!loading && !error && hasMore ? <div className="text-center"><Button variant="ghost" size="sm" disabled={loadingMore} onClick={() => void loadOlder()}>{loadingMore ? "Carregando..." : "Carregar mensagens anteriores"}</Button></div> : null}
        {!loading && !error && messages.length === 0 ? <div className="py-12 text-center"><MessageCircle className="mx-auto mb-3 size-9 text-primary/40" /><p className="font-medium">O chat está tranquilo por enquanto.</p><p className="mt-1 text-sm text-muted-foreground">Envie a primeira mensagem e dê início à conversa.</p></div> : null}
        {messages.map((message) => {
          const member = members[message.user_id];
          const mine = message.user_id === user?.id;
          return <div key={message.id} className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
            <Avatar className="size-9 shrink-0"><AvatarImage src={member?.avatar_url ?? undefined} /><AvatarFallback className="bg-primary/10 text-xs text-primary">{initials(member?.display_name || (mine ? myName : null))}</AvatarFallback></Avatar>
            <div className={`min-w-0 max-w-[85%] rounded-2xl px-3.5 py-2.5 ${mine ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-800 dark:bg-muted dark:text-foreground"}`}>
              <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5"><span className="text-xs font-bold">{mine ? "Você" : member?.display_name || "Membro"}</span><time className={`text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`} dateTime={message.criado_em}>{new Date(message.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time></div>
              <p className="whitespace-pre-wrap break-words text-sm">{message.conteudo}</p>
              <div className={`mt-1 flex gap-2 ${mine ? "justify-end" : ""}`}>
                {mine ? <button type="button" onClick={() => void removeOwn(message)} className="inline-flex items-center gap-1 text-[10px] opacity-70 hover:opacity-100"><Trash2 className="size-3" /> Apagar</button> : <>
                  <button type="button" onClick={() => void report(message)} className="inline-flex items-center gap-1 text-[10px] opacity-70 hover:opacity-100"><Flag className="size-3" /> Denunciar</button>
                  <button type="button" onClick={() => void block(message.user_id)} className="inline-flex items-center gap-1 text-[10px] opacity-70 hover:opacity-100"><ShieldBan className="size-3" /> Bloquear</button>
                </>}
              </div>
            </div>
          </div>;
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="border-t border-border/60 bg-slate-50/70 p-3 dark:bg-muted/20 sm:p-4">
        <div className="flex items-end gap-2">
          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} rows={2} placeholder="Escreva uma mensagem para a comunidade..." className="max-h-28 min-h-12 resize-none bg-white dark:bg-background" />
          <Button type="submit" size="icon" className="size-12 shrink-0 rounded-xl" disabled={!draft.trim() || sending || !user} aria-label="Enviar mensagem">{sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</Button>
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>Seja respeitoso. Mensagens podem ser denunciadas.</span><span>{draft.length}/500</span></div>
      </form>
    </Card>
  );
}
