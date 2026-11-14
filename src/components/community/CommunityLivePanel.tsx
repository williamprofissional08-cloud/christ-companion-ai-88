import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel, User } from "@supabase/supabase-js";
import { Camera, CameraOff, Loader2, Mic, MicOff, Play, Plus, Radio, ShieldBan, UsersRound, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { explainLiveMediaError, isMissingMediaDevice } from "@/lib/live-startup-errors";

/**
 * Pilot livestreams using the project's EXISTING Supabase Realtime service.
 * Presence discovers real, currently connected hosts; Broadcast carries
 * WebRTC SDP/ICE. No database writes, new tables or paid video service.
 *
 * P2P + STUN is suitable for SMALL rooms only. Some NATs need TURN.
 * Public Realtime channels do not provide enforceable identity-based moderation:
 * the host blocks removed peers locally, but hardened multi-device bans require
 * authenticated, server-enforced Realtime authorization.
 */
const LOBBY_TOPIC = "caminho-divino:live:lobby:v3";
const MAX_VIEWERS = 4;
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
};

type Live = {
  kind: "live";
  sessionId: string;
  hostPeerId: string;
  hostUserId: string;
  hostName: string;
  title: string;
  started: number;
};

type SignalKind = "join" | "offer" | "answer" | "candidate" | "leave" | "kicked" | "ended" | "full";
type Signal = {
  sessionId: string;
  from: string;
  to?: string;
  userId: string;
  name: string;
  kind: SignalKind;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

type Room = { live: Live; role: "host" | "viewer" };
type ViewerInfo = { id: string; name: string; userId: string };

function getDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};
  const raw = meta["full_name"] ?? meta["display_name"] ?? meta["name"] ?? user.email?.split("@")[0];
  return typeof raw === "string" && raw.trim() ? raw.trim().slice(0, 48) : "Membro";
}

function readActiveLives(channel: RealtimeChannel): Live[] {
  const state = channel.presenceState() as Record<string, unknown[]>;
  const now = Date.now();
  const unique = new Map<string, Live>();
  for (const peers of Object.values(state)) {
    for (const raw of peers) {
      if (!raw || typeof raw !== "object") continue;
      const item = raw as Partial<Live>;
      if (item.kind !== "live" || typeof item.sessionId !== "string" ||
        typeof item.hostPeerId !== "string" || typeof item.hostUserId !== "string" ||
        typeof item.title !== "string" || typeof item.started !== "number" ||
        item.started > now + 60_000 || item.started < now - 4 * 60 * 60 * 1000) continue;
      unique.set(item.sessionId, {
        kind: "live", sessionId: item.sessionId, hostPeerId: item.hostPeerId,
        hostUserId: item.hostUserId, hostName: typeof item.hostName === "string" ? item.hostName.slice(0, 48) : "Membro",
        title: item.title.slice(0, 90), started: item.started,
      });
    }
  }
  return Array.from(unique.values()).sort((a, b) => b.started - a.started).slice(0, 30);
}

export function CommunityLivePanel({ user, requestOpen, onRequestHandled }: {
  user: User | null;
  requestOpen: boolean;
  onRequestHandled: () => void;
}) {
  const myPeerId = useRef(crypto.randomUUID());
  const [retryKey, setRetryKey] = useState(0);
  const [lobbyStatus, setLobbyStatus] = useState<"connecting" | "ready" | "error">("connecting");
  const [lives, setLives] = useState<Live[]>([]);
  const [title, setTitle] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [viewers, setViewers] = useState<ViewerInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");
  const [playingBlocked, setPlayingBlocked] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [hasVideo, setHasVideo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lobbyRef = useRef<RealtimeChannel | null>(null);
  const roomRef = useRef<RealtimeChannel | null>(null);
  const activeRef = useRef<Room | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteStream = useRef<MediaStream | null>(null);
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideo = useRef<HTMLVideoElement | null>(null);
  const peers = useRef<Map<string, RTCPeerConnection>>(new Map());
  const viewersRef = useRef<Map<string, ViewerInfo>>(new Map());
  const blockedPeers = useRef<Set<string>>(new Set());
  const blockedUsers = useRef<Set<string>>(new Set());
  const candidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const myUserId = user?.id ?? "";
  const myName = user ? getDisplayName(user) : "Membro";

  useEffect(() => {
    if (!user) return;
    let active = true;
    const channel = supabase.channel(LOBBY_TOPIC, {
      config: { presence: { key: myPeerId.current } },
    });
    lobbyRef.current = channel;
    channel.on("presence", { event: "sync" }, () => {
      if (active) setLives(readActiveLives(channel));
    });
    channel.subscribe((status) => {
      if (!active) return;
      if (status === "SUBSCRIBED") {
        setLobbyStatus("ready");
        setLives(readActiveLives(channel));
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setLobbyStatus("error");
      }
    });
    return () => {
      active = false;
      if (lobbyRef.current === channel) lobbyRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [myUserId, retryKey]);

  useEffect(() => {
    if (requestOpen) {
      setCreateOpen(true);
      onRequestHandled();
    }
  }, [requestOpen, onRequestHandled]);

  useEffect(() => {
    if (room?.role === "host" && localVideo.current && localStream.current) {
      localVideo.current.srcObject = localStream.current;
      void localVideo.current.play().catch(() => {});
    }
    if (room?.role === "viewer" && remoteVideo.current && remoteStream.current) {
      remoteVideo.current.srcObject = remoteStream.current;
      void remoteVideo.current.play().then(() => setPlayingBlocked(false))
        .catch(() => setPlayingBlocked(true));
    }
  }, [room?.live.sessionId, room?.role]);

  function closePeer(id: string) {
    peers.current.get(id)?.close();
    peers.current.delete(id);
    candidates.current.delete(id);
    viewersRef.current.delete(id);
    setViewers(Array.from(viewersRef.current.values()));
  }

  function tearDownMediaAndRoom() {
    for (const peer of peers.current.values()) peer.close();
    peers.current.clear();
    candidates.current.clear();
    viewersRef.current.clear();
    blockedPeers.current.clear();
    blockedUsers.current.clear();
    localStream.current?.getTracks().forEach((track) => track.stop());
    localStream.current = null;
    remoteStream.current = null;
    if (localVideo.current) localVideo.current.srcObject = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    if (roomRef.current) {
      const channel = roomRef.current;
      roomRef.current = null;
      void supabase.removeChannel(channel);
    }
  }

  function send(signal: Omit<Signal, "sessionId" | "from" | "userId" | "name">) {
    const active = activeRef.current;
    const channel = roomRef.current;
    if (!active || !channel) return Promise.resolve("error");
    return channel.send({
      type: "broadcast", event: "signal",
      payload: {
        ...signal,
        sessionId: active.live.sessionId,
        from: myPeerId.current,
        userId: myUserId,
        name: myName,
      } satisfies Signal,
    });
  }

  async function leaveRoom() {
    const current = activeRef.current;
    if (!current) return;
    if (current.role === "host") {
      await send({ kind: "ended" }).catch(() => {});
      await lobbyRef.current?.untrack().catch(() => {});
    } else {
      await send({ kind: "leave", to: current.live.hostPeerId }).catch(() => {});
    }
    activeRef.current = null;
    tearDownMediaAndRoom();
    setRoom(null);
    setViewers([]);
    setConnectionStatus("");
    setError(null);
    setPlayingBlocked(false);
    setLives((existing) => existing.filter((live) => live.sessionId !== current.live.sessionId));
  }

  // On navigation, release camera and both Realtime channels even if the user
  // doesn't press "Encerrar". Presence automatically clears disconnected hosts.
  useEffect(() => () => {
    activeRef.current = null;
    for (const peer of peers.current.values()) peer.close();
    peers.current.clear();
    localStream.current?.getTracks().forEach((track) => track.stop());
    if (roomRef.current) void supabase.removeChannel(roomRef.current);
  }, []);

  async function flushCandidates(peerId: string, pc: RTCPeerConnection) {
    const pending = candidates.current.get(peerId) ?? [];
    candidates.current.delete(peerId);
    for (const item of pending) await pc.addIceCandidate(item);
  }

  function establishPeer(otherPeerId: string, hosting: boolean) {
    closePeer(otherPeerId);
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peers.current.set(otherPeerId, pc);
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        void send({ kind: "candidate", to: otherPeerId, candidate: event.candidate.toJSON() });
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        setError("Esta conexão de vídeo precisa de um servidor TURN ou de outra rede. Tente Wi-Fi ou dados móveis.");
      } else if (!hosting && pc.connectionState === "connected") {
        setConnectionStatus("Conectado à transmissão.");
        setError(null);
      }
    };
    if (hosting) {
      localStream.current?.getTracks().forEach((track) => {
        if (localStream.current) pc.addTrack(track, localStream.current);
      });
    } else {
      pc.ontrack = (event) => {
        const stream = event.streams[0] ?? new MediaStream([event.track]);
        remoteStream.current = stream;
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = stream;
          void remoteVideo.current.play().then(() => {
            setPlayingBlocked(false);
          }).catch(() => setPlayingBlocked(true));
        }
        setConnectionStatus("Conectado à transmissão.");
      };
    }
    return pc;
  }

  async function handleSignal(raw: unknown) {
    const active = activeRef.current;
    if (!active || typeof raw !== "object" || raw === null) return;
    const s = raw as Partial<Signal>;
    if (s.sessionId !== active.live.sessionId || typeof s.from !== "string" ||
      s.from === myPeerId.current || (s.to && s.to !== myPeerId.current) ||
      typeof s.kind !== "string") return;
    const from = s.from;
    const host = active.role === "host";
    if (!host && from !== active.live.hostPeerId) return;

    try {
      if (s.kind === "ended" && !host) {
        toast.info("A live foi encerrada pelo organizador.");
        await leaveRoom();
        return;
      }
      if (s.kind === "kicked" && !host && s.to === myPeerId.current) {
        toast.error("O organizador removeu você desta live.");
        await leaveRoom();
        return;
      }
      if (s.kind === "full" && !host && s.to === myPeerId.current) {
        setError("Esta live já atingiu o limite inicial de quatro espectadores simultâneos.");
        await leaveRoom();
        return;
      }
      if (host && s.kind === "join") {
        const viewerId = typeof s.userId === "string" ? s.userId : "";
        if (blockedPeers.current.has(from) || (viewerId && blockedUsers.current.has(viewerId))) {
          await send({ kind: "kicked", to: from }); return;
        }
        if (peers.current.size >= MAX_VIEWERS && !peers.current.has(from)) {
          await send({ kind: "full", to: from }); return;
        }
        const name = typeof s.name === "string" ? s.name.slice(0, 48) : "Membro";
        const pc = establishPeer(from, true);
        viewersRef.current.set(from, { id: from, userId: viewerId, name });
        setViewers(Array.from(viewersRef.current.values()));
        await pc.setLocalDescription(await pc.createOffer());
        await send({ kind: "offer", to: from, sdp: pc.localDescription!.toJSON() });
      } else if (!host && s.kind === "offer" && s.sdp?.type === "offer") {
        const pc = establishPeer(from, false);
        await pc.setRemoteDescription(s.sdp);
        await flushCandidates(from, pc);
        await pc.setLocalDescription(await pc.createAnswer());
        await send({ kind: "answer", to: from, sdp: pc.localDescription!.toJSON() });
      } else if (host && s.kind === "answer" && s.sdp?.type === "answer") {
        const pc = peers.current.get(from);
        if (!pc) return;
        await pc.setRemoteDescription(s.sdp);
        await flushCandidates(from, pc);
      } else if (s.kind === "candidate" && s.candidate &&
        typeof s.candidate.candidate === "string") {
        const pc = peers.current.get(from);
        if (pc?.remoteDescription) await pc.addIceCandidate(s.candidate);
        else candidates.current.set(from, [...(candidates.current.get(from) ?? []), s.candidate]);
      } else if (host && s.kind === "leave") {
        closePeer(from);
      }
    } catch {
      setError("Falha na negociação do vídeo. Saia da transmissão e tente entrar novamente.");
    }
  }

  async function joinRoom(live: Live, role: Room["role"], stream?: MediaStream) {
    if (activeRef.current) return;
    const newRoom = { live, role };
    activeRef.current = newRoom;
    if (stream) localStream.current = stream;
    setRoom(newRoom);
    setError(null);
    setConnectionStatus(role === "host" ? "Preparando transmissão…" : "Conectando à live…");
    const roomChannel = supabase.channel("caminho-divino:live:room:" + live.sessionId, {
      config: { broadcast: { ack: true } },
    });
    roomRef.current = roomChannel;
    roomChannel.on("broadcast", { event: "signal" }, ({ payload }) => {
      void handleSignal(payload);
    });
    roomChannel.subscribe((status) => {
      if (activeRef.current?.live.sessionId !== live.sessionId) return;
      if (status === "SUBSCRIBED") {
        if (role === "host") {
          void (async () => {
            const result = await lobbyRef.current?.track(live);
            if (result !== "ok") {
              setError("O servidor de comunidade não conseguiu anunciar a transmissão.");
              await leaveRoom();
              return;
            }
            setConnectionStatus("Ao vivo — aguardando participantes.");
          })();
        } else {
          void send({ kind: "join", to: live.hostPeerId })
            .then((statusResult) => {
              if (statusResult !== "ok") setError("Não foi possível entrar na transmissão. Tente novamente.");
            });
        }
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setError("A comunicação em tempo real falhou. Verifique sua conexão.");
        void leaveRoom();
      }
    });
  }

  async function startLive() {
    if (!user || busy || activeRef.current || lobbyStatus !== "ready") return;
    const name = title.trim();
    if (name.length < 5 || name.length > 90) {
      toast.error("Escolha um título de 5 a 90 caracteres para sua live.");
      return;
    }
    setBusy(true);
    setError(null);
    let stream: MediaStream | null = null;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw Object.assign(new Error("Captura de vídeo não disponível."), { name: "SecurityError" });
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (deviceError) {
        if (!isMissingMediaDevice(deviceError)) throw deviceError;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          toast.info("Câmera indisponível. Iniciando apenas com áudio.");
        } catch (audioError) {
          if (!isMissingMediaDevice(audioError)) throw audioError;
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
          toast.info("Microfone indisponível. Iniciando apenas com vídeo.");
        }
      }
      setCameraOn(stream.getVideoTracks().length > 0);
      setMicOn(stream.getAudioTracks().length > 0);
      setHasVideo(stream.getVideoTracks().length > 0);
      const live: Live = {
        kind: "live", sessionId: crypto.randomUUID(), hostPeerId: myPeerId.current,
        hostUserId: user.id, hostName: getDisplayName(user), title: name, started: Date.now(),
      };
      await joinRoom(live, "host", stream);
      stream = null;
      setCreateOpen(false);
    } catch (issue) {
      stream?.getTracks().forEach((track) => track.stop());
      const message = explainLiveMediaError(issue);
      setError(message);
      toast.error(message);
    } finally { setBusy(false); }
  }

  function kickViewer(viewer: ViewerInfo) {
    if (activeRef.current?.role !== "host") return;
    if (!window.confirm("Remover esta pessoa da live? Ela não poderá retornar nesta sessão.")) return;
    blockedPeers.current.add(viewer.id);
    if (viewer.userId) blockedUsers.current.add(viewer.userId);
    void send({ kind: "kicked", to: viewer.id });
    closePeer(viewer.id);
    toast.success("Participante removido desta transmissão.");
  }

  function toggleAudio() {
    const tracks = localStream.current?.getAudioTracks() ?? [];
    const next = !tracks[0]?.enabled;
    tracks.forEach((track) => { track.enabled = next; });
    if (tracks.length) setMicOn(next);
  }

  function toggleVideo() {
    const tracks = localStream.current?.getVideoTracks() ?? [];
    const next = !tracks[0]?.enabled;
    tracks.forEach((track) => { track.enabled = next; });
    if (tracks.length) setCameraOn(next);
  }

  return (
    <section id="community-live" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-bold text-[#102c55] dark:text-foreground">
          <Radio className="size-5 text-amber-500" aria-hidden="true" /> Lives da Comunidade
        </h3>
        <button type="button" onClick={() => setCreateOpen((value) => !value)}
          disabled={!user || lobbyStatus !== "ready" || Boolean(room)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-blue-300 bg-white px-4 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-50 disabled:opacity-50 dark:bg-card dark:text-blue-300">
          <Plus className="size-4" aria-hidden="true" /> Iniciar minha live
        </button>
      </div>

      {lobbyStatus === "connecting" && (
        <p role="status" className="flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="size-4 animate-spin" /> Conectando à comunidade…
        </p>
      )}
      {lobbyStatus === "error" && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
          A conexão da comunidade falhou.
          <button type="button" onClick={() => { setLobbyStatus("connecting"); setRetryKey((v) => v + 1); }}
            className="min-h-10 rounded-full border border-amber-400 px-3 font-semibold">Tentar novamente</button>
        </div>
      )}

      {createOpen && !room && lobbyStatus === "ready" && (
        <form onSubmit={(event) => { event.preventDefault(); void startLive(); }}
          className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:bg-slate-900">
          <label className="block space-y-2 text-sm font-semibold">
            Qual é o tema da sua live?
            <input required minLength={5} maxLength={90} value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Culto da Comunhão, Pregação, Oração, Testemunho…"
              className="min-h-12 w-full rounded-xl border border-blue-200 bg-white px-3 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600" />
          </label>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Use sua conta do Caminho Divino. Não há login de anfitrião externo nem alteração no banco.
            Esta versão inicial aceita até quatro espectadores simultâneos e requer uma conexão direta entre dispositivos.
          </p>
          <div className="flex gap-2">
            <button type="submit" disabled={busy}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Radio className="size-4" />}
              {busy ? "Iniciando…" : "Iniciar transmissão"}
            </button>
            <button type="button" onClick={() => setCreateOpen(false)}
              className="min-h-11 rounded-full border border-blue-200 px-4 text-sm">Cancelar</button>
          </div>
        </form>
      )}

      {lives.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-300">
            <span className="size-2 animate-pulse rounded-full bg-red-600" /> AO VIVO AGORA
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lives.map((live) => (
              <button key={live.sessionId} type="button"
                disabled={busy || Boolean(room)}
                onClick={() => {
                  if (!user) return;
                  if (live.hostPeerId === myPeerId.current) return;
                  void joinRoom(live, "viewer");
                }}
                className="flex min-h-20 items-center gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-[#0b3768] to-[#0b67a9] p-4 text-left text-white shadow-md disabled:opacity-60">
                <Radio className="size-6 shrink-0 text-amber-300" />
                <span className="min-w-0 flex-1">
                  <span className="block break-words font-bold">{live.title}</span>
                  <span className="text-xs text-blue-100">{live.hostName} · Assistir ao vivo</span>
                </span>
                <Play className="size-5 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {room && (
        <div className="space-y-3 rounded-2xl border border-blue-200 bg-[#092342] p-3 text-white">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{room.live.title}</p>
              <p className="text-xs text-blue-100">
                {room.role === "host" ? "Sua transmissão" : "Assistindo à transmissão"}
              </p>
            </div>
            <button type="button" onClick={() => void leaveRoom()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/40 px-3 text-sm hover:bg-white/10">
              <X className="size-4" /> {room.role === "host" ? "Encerrar live" : "Sair"}
            </button>
          </div>
          {room.role === "host" ? (
            <>
              {!hasVideo && <p className="text-xs text-blue-100">Transmissão somente com áudio.</p>}
              <video ref={localVideo} muted playsInline autoPlay
                aria-label="Prévia da sua câmera"
                className="aspect-video max-h-[65svh] w-full rounded-xl bg-black object-contain" />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={toggleAudio}
                  className="flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-4 text-sm">
                  {micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
                  {micOn ? "Desligar microfone" : "Ligar microfone"}
                </button>
                <button type="button" onClick={toggleVideo}
                  className="flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-4 text-sm">
                  {cameraOn ? <Camera className="size-4" /> : <CameraOff className="size-4" />}
                  {cameraOn ? "Desligar câmera" : "Ligar câmera"}
                </button>
              </div>
              <div className="space-y-2 rounded-xl border border-white/20 p-3">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <UsersRound className="size-4" /> Participantes ({viewers.length}/{MAX_VIEWERS})
                </h4>
                {viewers.length === 0 ? (
                  <p className="text-xs text-blue-100">Aguardando pessoas entrarem na live…</p>
                ) : viewers.map((viewer) => (
                  <div key={viewer.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/10 p-2">
                    <span className="min-w-0 truncate text-xs">{viewer.name}</span>
                    <button type="button" onClick={() => kickViewer(viewer)}
                      className="flex min-h-10 items-center gap-1 rounded-lg border border-red-200/40 px-3 text-xs hover:bg-red-700">
                      <ShieldBan className="size-4" /> Remover
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <video ref={remoteVideo} playsInline autoPlay controls
                aria-label="Vídeo da live" className="aspect-video max-h-[65svh] w-full rounded-xl bg-black object-contain" />
              {playingBlocked && (
                <button type="button" onClick={() => {
                  void remoteVideo.current?.play().then(() => setPlayingBlocked(false))
                    .catch(() => toast.error("Não foi possível iniciar o vídeo. Toque em reproduzir no player."));
                }} className="min-h-11 rounded-full bg-blue-600 px-4 text-sm font-semibold">
                  <Play className="mr-1 inline size-4" /> Ativar vídeo e som
                </button>
              )}
            </>
          )}
          {connectionStatus && <p role="status" className="text-xs text-blue-100">{connectionStatus}</p>}
        </div>
      )}
      {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
    </section>
  );
}
