import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft, Check, ChevronRight, Copy, Flag, Loader2, MessageCircle, Search,
  ShieldBan, Sparkles, UserRoundPlus, UsersRound, X,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as unknown as SupabaseClient;
export type FriendMember = { id: string; display_name: string | null; avatar_url: string | null };
export type FriendshipRequest = { id: string; solicitante_id: string; destinatario_id: string; status: "pendente" | "aceito" | "recusado" };
export type FriendConversationPreview = {
  conversation: { id: string };
  member: FriendMember | undefined;
  lastMessage: { conteudo: string; criado_em: string } | null;
  unread: number;
};
type Section = "discover" | "requests" | "friends";
type Props = {
  user: User | null;
  members: FriendMember[];
  blockedIds: string[];
  friendIds: string[];
  incomingRequests: FriendshipRequest[];
  outgoingRequests: FriendshipRequest[];
  previews: FriendConversationPreview[];
  search: string;
  onSearchChange: (value: string) => void;
  searchingMembers: boolean;
  memberSearchError: string | null;
  loading: boolean;
  error: string | null;
  starting: string | null;
  onRequest: (member: FriendMember) => void;
  onAccept: (request: FriendshipRequest) => void;
  onReject: (request: FriendshipRequest) => void;
  onMessage: (member: FriendMember) => void;
  onReport: (member: FriendMember) => void;
  onBlock: (member: FriendMember) => void;
  onRetry: () => void;
};

const card = "rounded-[1.6rem] border border-[#d5e4f4] bg-white/95 shadow-[0_6px_18px_rgba(19,55,94,.09)] dark:border-slate-700 dark:bg-card";
const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";
const initials = (value?: string | null) =>
  (value || "Membro").trim().split(/\s+/).slice(0, 2)
    .map((part) => part[0]?.toUpperCase()).join("");

function Face({ member, online, size = "size-12" }: {
  member: FriendMember | undefined; online: boolean; size?: string;
}) {
  return <span className="relative shrink-0">
    <Avatar className={`${size} border-2 border-white shadow-sm dark:border-slate-700`}>
      <AvatarImage src={member?.avatar_url ?? undefined} alt="" className="object-cover" />
      <AvatarFallback className="bg-[#e9f2fb] font-bold text-[#16365d] dark:bg-slate-700 dark:text-white">
        {initials(member?.display_name)}
      </AvatarFallback>
    </Avatar>
    {online && <span aria-label="Online agora" className="absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-white bg-emerald-500" />}
  </span>;
}

export function PrivateFriendsDesign({
  user, members, blockedIds, friendIds, incomingRequests, outgoingRequests,
  previews, search, onSearchChange, searchingMembers, memberSearchError,
  loading, error, starting, onRequest, onAccept, onReject, onMessage,
  onReport, onBlock, onRetry,
}: Props) {
  const [section, setSection] = useState<Section>("discover");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [profileMap, setProfileMap] = useState<Record<string, FriendMember>>({});
  const [onlineIds, setOnlineIds] = useState<string[]>([]);

  const knownIds = useMemo(() =>
    [...new Set([
      ...friendIds,
      ...incomingRequests.map((request) => request.solicitante_id),
      ...outgoingRequests.map((request) => request.destinatario_id),
      ...previews.map(({ member }) => member?.id).filter((id): id is string => !!id),
    ])].filter((id) => id !== user?.id && !blockedIds.includes(id))
      .sort().slice(0, 120),
    [friendIds, incomingRequests, outgoingRequests, previews, blockedIds, user?.id]);

  useEffect(() => {
    if (!knownIds.length) { setProfileMap({}); return; }
    let active = true;
    void db.from("community_member_profiles").select("id,display_name,avatar_url")
      .in("id", knownIds).then(({ data, error: profileError }) => {
        if (!active) return;
        if (profileError) {
          toast.error("Não foi possível carregar alguns nomes dos amigos.");
          return;
        }
        setProfileMap(Object.fromEntries(((data || []) as FriendMember[])
          .map((member) => [member.id, member])));
      });
    return () => { active = false; };
  }, [knownIds]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    // Presence from the same existing chat channel. No fabricated online status.
    const channel = db.channel("comunidade", { config: { presence: { key: user.id } } });
    channel.on("presence", { event: "sync" }, () => {
      if (!active) return;
      const presence = channel.presenceState() as Record<string, Array<{ user_id?: string }>>;
      setOnlineIds([...new Set(Object.values(presence).flat()
        .map((item) => item.user_id)
        .filter((id): id is string => typeof id === "string"))]);
    }).subscribe((state) => {
      if (state === "SUBSCRIBED") {
        void channel.track({
          user_id: user.id, nome: String(user.user_metadata?.["full_name"] ?? "Membro"),
          online_at: new Date().toISOString(),
        });
      }
    });
    return () => { active = false; void db.removeChannel(channel); };
  }, [user?.id]);

  const displayMembers = members.filter((member) =>
    member.id !== user?.id && !blockedIds.includes(member.id)
      && (!onlineOnly || onlineIds.includes(member.id)));

  const friends = friendIds
    .filter((id) => !blockedIds.includes(id))
    .map((id) => profileMap[id] ?? members.find((member) => member.id === id))
    .filter((member): member is FriendMember => !!member)
    .filter((member) => (!search.trim() ||
      member.display_name?.toLowerCase().includes(search.trim().toLowerCase()) ||
      member.id.toLowerCase().startsWith(search.trim().toLowerCase()))
      && (!onlineOnly || onlineIds.includes(member.id)));

  const incoming = incomingRequests.filter((item) => !blockedIds.includes(item.solicitante_id));
  const onlineFriends = friends.filter((member) => onlineIds.includes(member.id));
  const visiblePreviews = previews.filter(({ member }) =>
    !member?.id || !blockedIds.includes(member.id));

  function copyId(id: string) {
    void navigator.clipboard.writeText(id)
      .then(() => toast.success("ID copiado."))
      .catch(() => toast.error("Não foi possível copiar o ID."));
  }

  function actionFor(member: FriendMember) {
    const accepted = friendIds.includes(member.id);
    const incomingRequest = incomingRequests.find((request) => request.solicitante_id === member.id);
    const sent = outgoingRequests.some((request) => request.destinatario_id === member.id);
    const pending = starting === member.id;
    if (accepted) return <Button size="sm" variant="outline" disabled={starting !== null}
      onClick={() => onMessage(member)} className="min-h-10 shrink-0 rounded-xl border-blue-300 text-[#124e91] dark:text-blue-200">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="mr-1 size-4" />}
      Mensagem
    </Button>;
    if (incomingRequest) return <Button size="sm" disabled={starting !== null}
      onClick={() => onAccept(incomingRequest)} className="min-h-10 shrink-0 rounded-xl bg-[#1162b8] text-white hover:bg-[#0b478e]">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="mr-1 size-4" />}Aceitar
    </Button>;
    if (sent) return <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      Pedido enviado
    </span>;
    return <Button size="sm" disabled={starting !== null} onClick={() => onRequest(member)}
      className="min-h-10 shrink-0 rounded-xl bg-[#0963be] text-white hover:bg-[#084f9a]">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <UserRoundPlus className="mr-1 size-4" />}
      Adicionar
    </Button>;
  }

  function memberRow(member: FriendMember, key?: string) {
    const online = onlineIds.includes(member.id);
    return <div key={key || member.id} className="min-w-0 border-b border-[#e4edf8] py-3 last:border-b-0 dark:border-slate-700">
      <div className="flex min-w-0 flex-wrap items-center gap-3 sm:flex-nowrap">
        <Face member={member} online={online} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#112a50] dark:text-white">{member.display_name || "Membro"}</p>
          <p className="max-w-[220px] truncate text-xs text-slate-500 sm:max-w-full" title={member.id}>
            ID: {member.id.slice(0, 12)}…
          </p>
          {online && <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Online agora</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" className={`flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 dark:hover:bg-slate-800 ${focus}`}
            aria-label="Copiar ID público" onClick={() => copyId(member.id)}>
            <Copy className="size-4" />
          </button>
          {actionFor(member)}
          <button type="button" aria-label="Mais opções do membro"
            aria-expanded={expandedMember === member.id}
            onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
            className={`flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-blue-50 dark:hover:bg-slate-800 ${focus}`}>
            <ChevronRight className={`size-4 transition-transform ${expandedMember === member.id ? "rotate-90" : ""}`} />
          </button>
        </div>
      </div>
      {expandedMember === member.id && <div className="mt-2 flex flex-wrap gap-2 pl-0 sm:pl-16">
        <Button variant="outline" size="sm" onClick={() => copyId(member.id)}>Copiar ID completo</Button>
        <Button variant="outline" size="sm" onClick={() => onReport(member)}><Flag className="mr-1 size-4" /> Denunciar</Button>
        <Button variant="outline" size="sm" onClick={() => onBlock(member)}><ShieldBan className="mr-1 size-4" /> Bloquear</Button>
      </div>}
    </div>;
  }

  function requestsCard() {
    return <section className={`${card} p-4 sm:p-5`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#142e56] dark:text-white">
          <UserRoundPlus className="size-5 text-[#0d63aa]" /> Pedidos recebidos
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-sm text-blue-800">{incoming.length}</span>
        </h2>
      </div>
      {incoming.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        Nenhum pedido de amizade aguardando resposta.
      </p> : <div className="divide-y divide-[#e4edf8]">
        {incoming.map((request) => {
          const member = profileMap[request.solicitante_id] ??
            members.find((item) => item.id === request.solicitante_id);
          return <div key={request.id} className="flex min-w-0 flex-wrap items-center gap-2 py-3 sm:flex-nowrap">
            <Face member={member} online={onlineIds.includes(request.solicitante_id)} size="size-11" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{member?.display_name || "Membro da comunidade"}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">Quer se conectar com você.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={starting !== null} onClick={() => onAccept(request)}
                className="min-h-10 rounded-xl bg-[#1265b8] text-white hover:bg-[#0d508f]">
                <Check className="mr-1 size-4" /> Aceitar
              </Button>
              <Button size="sm" variant="outline" disabled={starting !== null} onClick={() => onReject(request)}
                className="min-h-10 rounded-xl">Recusar</Button>
            </div>
          </div>;
        })}
      </div>}
    </section>;
  }

  return <div className="mx-auto w-full max-w-6xl space-y-4 pb-5">
    <div className="space-y-1 text-center">
      <h1 className="font-display text-2xl font-bold text-[#0e2a51] dark:text-white sm:text-3xl">Mensagens privadas</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">Conexões e conversas com outros membros</p>
    </div>

    <Link to="/comunidade" className={`inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-[#15559a] hover:underline dark:text-blue-300 ${focus}`}>
      <ArrowLeft className="size-5" /> Voltar à Comunidade
    </Link>

    <section className={`${card} overflow-hidden`}>
      <div className="relative isolate min-h-36 overflow-hidden bg-gradient-to-r from-white via-[#f5faff] to-[#e5f2fc] px-4 py-5 dark:from-[#102744] dark:via-[#143d65] dark:to-[#12365a] sm:px-6 sm:py-7">
        <img src="/images/prayer-sunrise.webp" alt="" aria-hidden="true"
          className="absolute inset-y-0 right-0 -z-20 h-full w-[60%] object-cover object-center opacity-45" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white via-white/90 to-white/25 dark:from-[#102744] dark:via-[#102744]/90 dark:to-[#102744]/30" />
        <div className="max-w-[80%] space-y-1 sm:max-w-[63%]">
          <h2 className="font-display text-xl font-bold text-[#112b50] dark:text-white sm:text-2xl">Encontrar membros</h2>
          <p className="max-w-sm text-xs leading-relaxed text-slate-600 dark:text-blue-100 sm:text-sm">
            Amplie sua comunhão, faça novas amizades na fé e converse com outros membros do Caminho Divino.
          </p>
        </div>
      </div>
      <div className="space-y-3 p-3 sm:p-5">
        <div role="tablist" aria-label="Área de amizades" className="grid grid-cols-3 rounded-2xl border border-[#cadff2] bg-[#f5f9fe] p-1 dark:border-slate-700 dark:bg-slate-900">
          {([
            ["discover", UsersRound, "Descobrir"],
            ["requests", UserRoundPlus, "Pedidos"],
            ["friends", MessageCircle, "Amigos"],
          ] as const).map(([key, Icon, label]) => (
            <button key={key} role="tab" aria-selected={section===key} type="button"
              onClick={() => setSection(key)} className={`flex min-h-11 items-center justify-center gap-1 rounded-xl px-2 text-xs font-bold sm:text-sm ${focus} ${section===key ? "bg-gradient-to-r from-[#0a4b93] to-[#1777d1] text-white shadow" : "text-[#194571] hover:bg-white dark:text-slate-200 dark:hover:bg-slate-700"}`}>
              <Icon className="size-4" /><span>{label}</span>
              {key==="requests" && incoming.length>0 && <span className="rounded-full bg-white/25 px-1.5 text-xs">{incoming.length}</span>}
            </button>
          ))}
        </div>
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#527294]" />
          <span className="sr-only">Buscar por nome ou ID público</span>
          <input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nome ou ID público"
            className={`min-h-12 w-full min-w-0 rounded-2xl border border-[#c7dcf0] bg-white px-3 pl-11 text-base text-[#112e55] shadow-sm placeholder:text-slate-500 dark:bg-slate-900 dark:text-white ${focus}`} />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={onlineOnly} onClick={() => setOnlineOnly((value) => !value)}
            className={`flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold ${focus} ${onlineOnly ? "border-blue-600 bg-blue-100 text-blue-800" : "border-[#bed6ef] bg-[#f4f9ff] text-[#214a79] dark:bg-slate-800 dark:text-blue-100"}`}>
            <span className="size-2 rounded-full bg-emerald-500"/> Somente online
          </button>
          <span className="flex min-h-9 items-center gap-2 rounded-full border border-[#bed6ef] bg-[#f4f9ff] px-3 text-xs text-[#214a79] dark:bg-slate-800 dark:text-blue-100">
            <Sparkles className="size-3.5" /> Conexões na fé
          </span>
        </div>

        {section === "discover" && <div role="tabpanel" className="space-y-1">
          {searchingMembers && <p className="flex items-center justify-center gap-2 py-3 text-sm text-slate-600"><Loader2 className="size-4 animate-spin" /> Buscando membros…</p>}
          {memberSearchError && <p className="py-2 text-sm text-amber-700 dark:text-amber-300">{memberSearchError}</p>}
          <div className="grid gap-x-4 lg:grid-cols-2">
            {displayMembers.map((member) => memberRow(member))}
          </div>
          {!searchingMembers && !memberSearchError && displayMembers.length === 0 &&
            <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              {onlineOnly ? "Nenhum membro online encontrado com este filtro." : search.trim()
                ? "Nenhum membro encontrado com esse nome ou ID."
                : "Nenhum membro disponível no momento."}
            </p>}
        </div>}
        {section === "requests" && <div role="tabpanel">
          {requestsCard()}
          {outgoingRequests.length>0 && <div className="mt-3 rounded-xl border border-blue-100 p-3 dark:border-slate-700">
            <h3 className="text-sm font-bold">Pedidos enviados ({outgoingRequests.length})</h3>
            {outgoingRequests.map((item) => (
              <p key={item.id} className="py-2 text-xs text-slate-600 dark:text-slate-300">
                {profileMap[item.destinatario_id]?.display_name || "Membro"} — aguardando aceite
              </p>
            ))}
          </div>}
        </div>}
        {section === "friends" && <div role="tabpanel" className="grid gap-x-4 lg:grid-cols-2">
          {friends.map((member) => memberRow(member))}
          {friends.length===0 && <p className="col-span-full rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            {search.trim() ? "Nenhum amigo encontrado para esta busca." : "Você ainda não tem amigos adicionados."}
          </p>}
        </div>}
      </div>
    </section>

    {section === "discover" && <>
      {requestsCard()}
      <section className={`${card} p-4 sm:p-5`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#102a50] dark:text-white">
            <UsersRound className="size-5 text-blue-700"/> Seus amigos online
          </h2>
          <button type="button" onClick={() => setSection("friends")}
            className="inline-flex min-h-10 shrink-0 items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
            Ver amigos <ChevronRight className="size-4"/>
          </button>
        </div>
        {onlineFriends.length ? <div className="grid gap-2 sm:grid-cols-3">
          {onlineFriends.slice(0, 6).map((member) => (
            <button key={member.id} type="button" onClick={() => onMessage(member)}
              className={`flex items-center gap-2 rounded-2xl border border-[#d6e5f3] p-3 text-left hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-800 ${focus}`}>
              <Face member={member} online size="size-11"/>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">{member.display_name || "Membro"}</p>
                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Disponível para conversar</p>
              </div>
            </button>
          ))}
        </div> : <p className="text-sm text-slate-600 dark:text-slate-300">
          Nenhum amigo online identificado agora.
        </p>}
      </section>
    </>}

    <section className={`${card} p-4 sm:p-5`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#102a50] dark:text-white">
          <MessageCircle className="size-5 text-blue-700" /> Suas conversas
        </h2>
        <span className="text-xs text-slate-500">Disponíveis após aceitar a amizade</span>
      </div>
      {loading && <p className="flex items-center gap-2 py-4 text-sm text-slate-500"><Loader2 className="size-4 animate-spin"/>Carregando…</p>}
      {!loading && error && <div className="flex flex-wrap items-center gap-2 text-sm text-red-700">
        {error}<Button size="sm" variant="outline" onClick={onRetry}>Tentar novamente</Button>
      </div>}
      {!loading && !error && visiblePreviews.length===0 && <p className="rounded-xl bg-[#f3f8ff] p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
        Nenhuma conversa ainda. Adicione um amigo e aguarde o aceite para conversar.
      </p>}
      {visiblePreviews.map(({ conversation, member, lastMessage, unread }) => (
        <Link key={conversation.id} to="/comunidade/privado/$conversaId" params={{conversaId:conversation.id}}
          className={`flex min-h-16 items-center gap-3 border-b border-slate-100 py-2 last:border-b-0 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-slate-800 ${focus}`}>
          <Face member={member} online={Boolean(member && onlineIds.includes(member.id))} size="size-11" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{member?.display_name || "Membro"}</span>
            <span className="block truncate text-xs text-slate-600 dark:text-slate-300">{lastMessage?.conteudo || "Conversa iniciada"}</span>
          </span>
          {unread>0 && <span className="flex size-6 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">{unread>9?"9+":unread}</span>}
        </Link>
      ))}
    </section>
  </div>;
}
