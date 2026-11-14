import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Radio, Video, X, Play, Loader2, Plus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Session = {
  id: string;
  host_id: string;
  title: string;
  room_name: string;
  last_heartbeat_at: string;
  status: string;
};
type JitsiInstance = {
  addListener: (event: string, callback: () => void) => void;
  dispose: () => void;
};
type JitsiCtor = new (domain: string, options: {
  roomName: string; parentNode: HTMLElement; width: string; height: number;
  userInfo: { displayName: string };
  configOverwrite: { prejoinPageEnabled: boolean };
}) => JitsiInstance;
type WithJitsi = Window & { JitsiMeetExternalAPI?: JitsiCtor };
let loadingScript: Promise<void> | null = null;

function loadJitsi() {
  if (typeof window === "undefined") return Promise.reject(new Error("Navegador indisponível."));
  if ((window as WithJitsi).JitsiMeetExternalAPI) return Promise.resolve();
  if (loadingScript) return loadingScript;
  loadingScript = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => (window as WithJitsi).JitsiMeetExternalAPI
      ? resolve()
      : reject(new Error("A sala de transmissão não pôde ser carregada."));
    script.onerror = () => reject(new Error("Não foi possível conectar ao serviço de transmissão."));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    loadingScript = null;
    throw error;
  });
  return loadingScript;
}

/**
 * “Ao vivo” is conditional on an authenticated host joining a real conference.
 * A heartbeat expires after 50 seconds if they disconnect without ending it.
 * The public Jitsi service is third-party and may require its own host login.
 */
export function CommunityLivePanel({ user, requestOpen, onRequestHandled }: {
  user: User | null;
  requestOpen: boolean;
  onRequestHandled: () => void;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [title, setTitle] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [room, setRoom] = useState<string | null>(null);
  const [mode, setMode] = useState<"host" | "viewer">("viewer");
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiInstance | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const hostIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const threshold = new Date(Date.now() - 50_000).toISOString();
    const { data, error } = await supabase.from("community_live_sessions")
      .select("id,host_id,title,room_name,last_heartbeat_at,status")
      .eq("status", "live").gt("last_heartbeat_at", threshold)
      .order("started_at", { ascending: false }).limit(10);
    if (!error) setSessions((data ?? []) as Session[]);
    else setSessions([]);
  }, []);

  useEffect(() => {
    if (!user) return;
    void load();
    const timer = window.setInterval(() => void load(), 12_000);
    return () => window.clearInterval(timer);
  }, [user, load]);

  useEffect(() => {
    if (requestOpen) {
      setCreateOpen(true);
      onRequestHandled();
    }
  }, [requestOpen, onRequestHandled]);

  function clearRoom() {
    if (heartbeatRef.current !== null) window.clearInterval(heartbeatRef.current);
    heartbeatRef.current = null;
    apiRef.current?.dispose();
    apiRef.current = null;
  }

  async function endHost() {
    const id = sessionIdRef.current;
    sessionIdRef.current = null;
    if (id && hostIdRef.current === user?.id) {
      await supabase.from("community_live_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", id).eq("host_id", user.id);
    }
    clearRoom();
    setRoom(null);
    setConnected(false);
    setConnecting(false);
    await load();
  }

  useEffect(() => {
    if (!room || !frameRef.current || !user) return;
    let cancelled = false;
    let instance: JitsiInstance | null = null;
    const host = mode === "host";
    setConnecting(true);
    void (async () => {
      try {
        await loadJitsi();
        if (cancelled || !frameRef.current) return;
        const API = (window as WithJitsi).JitsiMeetExternalAPI;
        if (!API) throw new Error("Transmissão não disponível.");
        instance = new API("meet.jit.si", {
          roomName: room, parentNode: frameRef.current, width: "100%", height: 450,
          userInfo: { displayName: String(user.user_metadata?.["full_name"] ?? user.email?.split("@")[0] ?? "Membro") },
          configOverwrite: { prejoinPageEnabled: true },
        });
        apiRef.current = instance;
        instance.addListener("videoConferenceJoined", () => {
          if (cancelled) return;
          setConnected(true);
          setConnecting(false);
          if (!host) return;
          void (async () => {
            const { data, error } = await supabase.from("community_live_sessions")
              .insert({ host_id: user.id, title: title.trim(), room_name: room, status: "live" })
              .select("id").single();
            if (error || !data) {
              toast.error("A live conectou, mas não pôde ser publicada. Verifique a configuração da comunidade.");
              clearRoom();
              setRoom(null);
              return;
            }
            sessionIdRef.current = data.id;
            hostIdRef.current = user.id;
            void load();
            heartbeatRef.current = window.setInterval(() => {
              if (sessionIdRef.current) void supabase.from("community_live_sessions")
                .update({ last_heartbeat_at: new Date().toISOString() })
                .eq("id", sessionIdRef.current).eq("host_id", user.id);
            }, 15_000);
          })();
        });
        instance.addListener("videoConferenceLeft", () => {
          if (!cancelled) void endHost();
        });
        instance.addListener("readyToClose", () => {
          if (!cancelled) void endHost();
        });
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Não foi possível abrir a transmissão.");
          setRoom(null);
          setConnecting(false);
        }
      }
    })();
    return () => {
      cancelled = true;
      instance?.dispose();
      if (heartbeatRef.current !== null) window.clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
      const id = sessionIdRef.current;
      sessionIdRef.current = null;
      if (host && id) void supabase.from("community_live_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", id).eq("host_id", user.id);
    };
    // Room is intentionally not restarted by title/connection state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, mode, user?.id]);

  function startLive() {
    if (!user) return;
    const trimmed = title.trim();
    if (trimmed.length < 5 || trimmed.length > 90) {
      toast.error("Escolha um tema de 5 a 90 caracteres, como 'Culto da Comunhão'.");
      return;
    }
    setCreateOpen(false);
    setMode("host");
    setRoom("CaminhoDivino-" + crypto.randomUUID());
  }

  function watch(item: Session) {
    setMode("viewer");
    setTitle(item.title);
    setRoom(item.room_name);
  }

  return (
    <section id="community-live" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-bold text-[#102c55] dark:text-foreground">
          <Radio className="size-5 text-amber-500" /> Transmissões da Comunidade
        </h3>
        <button type="button" onClick={() => setCreateOpen((v) => !v)}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-blue-300 bg-white px-4 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 dark:bg-card dark:text-blue-300">
          <Plus className="size-4" /> Iniciar minha live
        </button>
      </div>

      {createOpen && (
        <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-[#132a4b] dark:bg-slate-900 dark:text-foreground">
          <label className="block space-y-2 text-sm font-semibold">
            Qual será o tema da sua transmissão?
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              minLength={5} maxLength={90} placeholder="Ex.: Culto da Comunhão, Oração, Testemunho"
              className="min-h-12 w-full rounded-xl border border-blue-200 bg-white px-3 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600" />
          </label>
          <p className="text-xs text-slate-600 dark:text-slate-300">Sua live só aparecerá para outras pessoas quando você entrar na sala de vídeo. Serviço externo de reuniões, sujeito às regras do provedor.</p>
          <div className="flex gap-2">
            <button type="button" onClick={startLive} disabled={!user}
              className="min-h-11 rounded-full bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800">Abrir transmissão</button>
            <button type="button" onClick={() => setCreateOpen(false)} className="min-h-11 rounded-full border px-4 text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300"><span className="size-2 animate-pulse rounded-full bg-red-500" /> AO VIVO AGORA</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((item) => (
              <button key={item.id} type="button" onClick={() => watch(item)}
                className="flex min-h-20 items-center gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-[#0b3768] to-[#0b67a9] p-4 text-left text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                <Video className="size-7 shrink-0 text-amber-300" />
                <span className="min-w-0 flex-1"><span className="block truncate font-bold">{item.title}</span><span className="text-xs text-blue-100">Assistir ao vivo</span></span>
                <Play className="size-5 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
      {sessions.length === 0 && !room && (
        <p className="rounded-xl border border-blue-100 bg-white/80 px-3 py-3 text-sm text-slate-600 dark:bg-card dark:text-slate-300">
          Nenhuma live acontecendo agora. Quando um membro iniciar uma transmissão, ela aparecerá aqui.
        </p>
      )}

      {room && (
        <div className="space-y-3 rounded-2xl border border-blue-200 bg-[#081f3a] p-3 text-white">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold"><UsersRound className="size-4" /> {mode === "host" ? "Sua transmissão" : "Participando da transmissão"}</p>
            <button type="button" onClick={() => void endHost()}
              className="flex min-h-10 items-center gap-1 rounded-full border border-white/40 px-3 text-sm hover:bg-white/10" aria-label="Sair da transmissão">
              <X className="size-4" /> Encerrar / Sair
            </button>
          </div>
          {connecting && <p className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" /> Conectando à sala…</p>}
          {connected && <p className="text-xs text-blue-100">Conexão estabelecida. Respeite a privacidade e obtenha consentimento de todos os participantes.</p>}
          <div ref={frameRef} className="min-h-[300px] overflow-hidden rounded-xl bg-black" />
        </div>
      )}
    </section>
  );
}
