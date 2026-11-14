import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { CheckCircle2, Loader2, MessageCircle, Plus, Send, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient;
type Group = { id: string; creator_id: string; title: string; description: string; created_at: string };
type Message = { id: string; group_id: string; user_id: string; body: string; created_at: string };

export function CommunityGroupsPanel({ user }: { user: User | null }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [joined, setJoined] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadGroups = useCallback(async () => {
    if (!user) return;
    const [g, m] = await Promise.all([
      db.from("community_groups").select("id,creator_id,title,description,created_at").eq("status","active").order("created_at", { ascending: false }).limit(24),
      db.from("community_group_members").select("group_id").eq("user_id",user.id),
    ]);
    if (g.error || m.error) {
      setLoading(false);
      return;
    }
    setGroups((g.data ?? []) as Group[]);
    setJoined(new Set(((m.data ?? []) as { group_id: string }[]).map(v => v.group_id)));
    setLoading(false);
  }, [user?.id]);

  const loadMessages = useCallback(async (groupId: string) => {
    const { data, error } = await db.from("community_group_messages")
      .select("id,group_id,user_id,body,created_at")
      .eq("group_id", groupId).order("created_at",{ascending: false}).limit(50);
    if (error) return;
    setMessages(((data ?? []) as Message[]).reverse());
  }, []);

  useEffect(() => { void loadGroups(); }, [loadGroups]);

  useEffect(() => {
    if (!selected || !joined.has(selected)) { setMessages([]); return; }
    void loadMessages(selected);
    const channel = db.channel("community-group-" + selected)
      .on("postgres_changes", { event:"INSERT",schema:"public",table:"community_group_messages",filter:"group_id=eq."+selected },
        () => void loadMessages(selected)).subscribe();
    const interval = window.setInterval(() => void loadMessages(selected), 12_000);
    return () => { window.clearInterval(interval); void db.removeChannel(channel); };
  }, [selected, joined, loadMessages]);

  async function createGroup(event: FormEvent) {
    event.preventDefault();
    if (!user || title.trim().length < 3 || title.trim().length > 75) return;
    setBusy(true);
    const { data, error } = await db.from("community_groups")
      .insert({ creator_id:user.id, title:title.trim(), description:description.trim() })
      .select("id").single();
    if (error || !data) {
      toast.error("Não foi possível criar o grupo. Confira as permissões.");
    } else {
      const { error: joinError } = await db.from("community_group_members")
        .insert({ group_id:data.id,user_id:user.id });
      if (joinError) toast.error("Grupo criado. Entre no grupo para enviar mensagens.");
      setTitle(""); setDescription(""); setShowForm(false);
      setSelected(data.id);
      toast.success("Grupo criado.");
      await loadGroups();
    }
    setBusy(false);
  }

  async function toggleJoin(id: string) {
    if (!user || busy) return;
    setBusy(true);
    const wasJoined = joined.has(id);
    const { error } = wasJoined
      ? await db.from("community_group_members").delete().eq("group_id",id).eq("user_id",user.id)
      : await db.from("community_group_members").insert({ group_id:id,user_id:user.id });
    if (error) toast.error("Não foi possível atualizar sua participação.");
    else {
      if (wasJoined && selected === id) setSelected(null);
      else if (!wasJoined) setSelected(id);
      await loadGroups();
    }
    setBusy(false);
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!user || !selected || !joined.has(selected) || busy) return;
    const body = draft.trim();
    if (!body || body.length > 1000) return;
    setBusy(true);
    const { error } = await db.from("community_group_messages")
      .insert({ group_id:selected,user_id:user.id,body });
    if (error) toast.error("Não foi possível enviar a mensagem.");
    else { setDraft(""); await loadMessages(selected); }
    setBusy(false);
  }

  return (
    <section id="community-groups" className="space-y-3 rounded-[1.5rem] border border-blue-100 bg-white/95 p-4 shadow-sm dark:border-slate-700 dark:bg-card sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#102d58] dark:text-foreground">
            <UsersRound className="size-5 text-blue-700" /> Grupos da Comunidade
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300">Encontre pessoas, participe e converse dentro dos grupos.</p>
        </div>
        <button type="button" onClick={() => setShowForm(v=>!v)}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
          <Plus className="size-4" /> Criar grupo
        </button>
      </div>

      {showForm && (
        <form onSubmit={createGroup} className="space-y-2 rounded-2xl bg-blue-50 p-3 dark:bg-slate-900">
          <label className="block text-xs font-semibold">Nome do grupo
            <input required minLength={3} maxLength={75} value={title} onChange={e=>setTitle(e.target.value)}
              placeholder="Ex.: Jovens em comunhão"
              className="mt-1 min-h-11 w-full rounded-xl border border-blue-200 bg-white px-3 text-base text-slate-900" />
          </label>
          <label className="block text-xs font-semibold">Descrição
            <textarea maxLength={240} value={description} onChange={e=>setDescription(e.target.value)}
              placeholder="Qual é o propósito do grupo?"
              className="mt-1 min-h-20 w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-base text-slate-900" />
          </label>
          <button disabled={busy} className="min-h-10 rounded-full bg-blue-700 px-4 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? "Criando…" : "Criar e participar"}
          </button>
        </form>
      )}

      {loading ? <div className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="size-4 animate-spin" /> Carregando grupos…</div>
        : groups.length === 0 ? (
          <p className="rounded-xl bg-blue-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            Ainda não há grupos criados. Você pode começar o primeiro.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div key={group.id} className="flex flex-col gap-2 rounded-xl border border-blue-100 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <strong className="break-words text-sm text-[#14345f] dark:text-white">{group.title}</strong>
                <p className="line-clamp-2 flex-1 text-xs text-slate-600 dark:text-slate-300">{group.description || "Converse e participe com a comunidade."}</p>
                <button type="button" onClick={() => void (joined.has(group.id) ? setSelected(selected === group.id ? null : group.id) : toggleJoin(group.id))}
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-blue-300 px-3 text-xs font-semibold text-blue-800 hover:bg-blue-50 dark:text-blue-300">
                  {joined.has(group.id)
                    ? <><CheckCircle2 className="size-4" /> {selected===group.id ? "Fechar conversa" : "Abrir conversa"}</>
                    : <><UserPlus className="size-4" /> Participar</>}
                </button>
                {joined.has(group.id) && (
                  <button type="button" onClick={() => void toggleJoin(group.id)}
                    className="text-xs text-slate-500 underline hover:text-red-700">Sair do grupo</button>
                )}
              </div>
            ))}
          </div>
        )}
      {selected && joined.has(selected) && (
        <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/50 p-3 dark:bg-slate-900">
          <p className="flex items-center gap-2 text-sm font-bold"><MessageCircle className="size-4 text-blue-700" /> Conversa: {groups.find(g=>g.id===selected)?.title}</p>
          <div aria-label="Mensagens do grupo" className="max-h-72 space-y-2 overflow-y-auto rounded-xl bg-white p-3 dark:bg-slate-800">
            {messages.length===0 && <p className="text-sm text-slate-600 dark:text-slate-300">Ainda não há mensagens. Inicie a conversa.</p>}
            {messages.map(m=>(
              <div key={m.id} className={`max-w-[90%] break-words rounded-xl p-2 text-sm ${m.user_id===user?.id ? "ml-auto bg-blue-100 text-blue-900" : "bg-slate-100 text-slate-900"}`}>
                <span className="text-[10px] font-semibold">{m.user_id===user?.id ? "Você" : "Membro da comunidade"}</span>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2">
            <input aria-label="Mensagem para o grupo" value={draft} onChange={e=>setDraft(e.target.value)} maxLength={1000}
              placeholder="Escreva para o grupo…" className="min-h-11 min-w-0 flex-1 rounded-xl border border-blue-200 bg-white px-3 text-base text-slate-900" />
            <button disabled={!draft.trim() || busy} aria-label="Enviar mensagem ao grupo"
              className="flex size-11 items-center justify-center rounded-xl bg-blue-700 text-white disabled:opacity-50"><Send className="size-5" /></button>
          </form>
        </div>
      )}
    </section>
  );
}
