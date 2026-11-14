import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient, User, RealtimeChannel } from "@supabase/supabase-js";
import { Camera, CameraOff, Loader2, Mic, MicOff, Play, Plus, Radio, ShieldBan, UsersRound, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { checkLiveBackendReady, explainLiveBackendError, explainLiveMediaError, isMissingMediaDevice } from "@/lib/live-startup-errors";

// The SQL migration creates these tables; the generated Supabase types are
// refreshed after deployment, so use the same untyped adapter as existing community code.
const db = supabase as unknown as SupabaseClient;
const ICE: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type Session = {
  id: string;
  host_id: string;
  title: string;
  room_name: string;
  status: string;
  last_heartbeat_at: string;
};
type Member = { user_id: string; status: "joined" | "left" | "kicked"; joined_at: string };
type Signal = {
  id: string;
  session_id: string;
  sender_id: string;
  receiver_id: string;
  kind: "join" | "offer" | "answer" | "candidate" | "leave";
  payload: Record<string, unknown>;
  created_at: string;
};
type Room = { session: Session; role: "host" | "viewer" };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível conectar à transmissão.";
}

/**
 * Small-room WebRTC live broadcast with authenticated Supabase signaling.
 * There is no Jitsi moderator or third-party host login. This is P2P:
 * an SFU/TURN service will be needed for large broadcasts or restrictive NATs.
 */
export function CommunityLivePanel({ user, requestOpen, onRequestHandled }: {
  user: User | null;
  requestOpen: boolean;
  onRequestHandled: () => void;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [topic, setTopic] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [joining, setJoining] = useState(false);
  const [connected, setConnected] = useState(false);
  const [playBlocked, setPlayBlocked] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [hasVideoTrack, setHasVideoTrack] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<"checking" | "ready" | "unavailable">("checking");
  const [backendIssue, setBackendIssue] = useState<string | null>(null);

  const liveRoom = useRef<Room | null>(null);
  const localMedia = useRef<MediaStream | null>(null);
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const channel = useRef<RealtimeChannel | null>(null);
  const peers = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const heartbeatTimer = useRef<number | null>(null);
  const memberTimer = useRef<number | null>(null);
  const processed = useRef<Set<string>>(new Set());

  const verifyInfrastructure = useCallback(async () => {
    setBackendStatus("checking");
    try {
      const problem = await checkLiveBackendReady(async (table) => {
        const { error: tableError } = await db.from(table)
          .select("id", { head: true }).limit(1);
        return tableError;
      });
      setBackendIssue(problem);
      setBackendStatus(problem ? "unavailable" : "ready");
    } catch (problem) {
      setBackendIssue(explainLiveBackendError(problem));
      setBackendStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    if (user) void verifyInfrastructure();
  }, [user?.id, verifyInfrastructure]);

  const loadSessions = useCallback(async () => {
    const after = new Date(Date.now() - 50_000).toISOString();
    const { data, error: readError } = await db.from("community_live_sessions")
      .select("id,host_id,title,room_name,status,last_heartbeat_at")
      .eq("status", "live").gt("last_heartbeat_at", after)
      .order("started_at", { ascending: false }).limit(20);
    if (!readError) setSessions((data ?? []) as Session[]);
  }, []);

  const loadMembers = useCallback(async (sessionId: string) => {
    const { data, error: readError } = await db.from("community_live_participants")
      .select("user_id,status,joined_at").eq("session_id", sessionId);
    if (!readError) setMembers((data ?? []) as Member[]);
  }, []);

  useEffect(() => {
    if (room?.role !== "host") return;
    let cancelled = false;
    const missing = members.filter((member) =>
      member.status === "joined" && !(member.user_id in memberNames)
    ).map((member) => member.user_id);
    if (!missing.length) return;
    void Promise.all(missing.map(async (id) => {
      const { data } = await db.rpc("search_community_members", {
        p_search: id, p_limit: 1,
      });
      const name = (data as { display_name?: string | null }[] | null)?.[0]?.display_name;
      return [id, name?.trim() || "Membro " + id.slice(0, 8)] as const;
    })).then((resolved) => {
      if (!cancelled) setMemberNames((previous) =>
        ({ ...previous, ...Object.fromEntries(resolved) }));
    });
    return () => { cancelled = true; };
  }, [members, memberNames, room?.role]);


  useEffect(() => {
    if (!user) return;
    void loadSessions();
    const timer = window.setInterval(() => void loadSessions(), 10_000);
    return () => window.clearInterval(timer);
  }, [user?.id, loadSessions]);

  useEffect(() => {
    if (!requestOpen) return;
    setCreateOpen(true);
    onRequestHandled();
  }, [requestOpen, onRequestHandled]);

  useEffect(() => {
    if (room?.role === "host" && localVideo.current && localMedia.current) {
      localVideo.current.srcObject = localMedia.current;
      void localVideo.current.play().catch(() => {});
    }
  }, [room?.session.id, room?.role]);

  function closePeers() {
    for (const peer of peers.current.values()) peer.close();
    peers.current.clear();
    pendingCandidates.current.clear();
  }

  function tearDown() {
    if (heartbeatTimer.current !== null) window.clearInterval(heartbeatTimer.current);
    if (memberTimer.current !== null) window.clearInterval(memberTimer.current);
    heartbeatTimer.current = null;
    memberTimer.current = null;
    if (channel.current) {
      void db.removeChannel(channel.current);
      channel.current = null;
    }
    closePeers();
    localMedia.current?.getTracks().forEach((track) => track.stop());
    localMedia.current = null;
    if (remoteVideo.current) remoteVideo.current.srcObject = null;
    processed.current.clear();
  }

  async function leaveRoom() {
    const active = liveRoom.current;
    if (!active || !user) return;
    liveRoom.current = null;
    tearDown();
    setRoom(null);
    setConnected(false);
    setJoining(false);
    setPlayBlocked(false);
    setMembers([]);
    if (active.role === "host") {
      const { error: endError } = await db.from("community_live_sessions")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", active.session.id).eq("host_id", user.id);
      if (endError) {
        toast.error("Falha ao encerrar a transmissão no servidor.");
      } else {
        // ICE candidates and descriptions can include network information.
        // Erase them promptly when the session ends.
        void db.from("community_live_signals").delete()
          .eq("session_id", active.session.id);
      }
    } else {
      await db.from("community_live_participants")
        .update({ status: "left", updated_at: new Date().toISOString() })
        .eq("session_id", active.session.id).eq("user_id", user.id)
        .eq("status", "joined");
    }
    await loadSessions();
  }

  async function startLive() {
    if (!user || busy || liveRoom.current) return;
    const name = topic.trim();
    if (name.length < 5 || name.length > 90) {
      toast.error("Escreva um título entre 5 e 90 caracteres.");
      return;
    }
    setBusy(true);
    setError(null);
    let stream: MediaStream | null = null;
    let stage: "server" | "device" = "server";
    try {
      // First check the three server tables. A failed migration or RLS rule
      // must not become a misleading camera permission prompt.
      const unavailable = await checkLiveBackendReady(async (table) => {
        const { error: tableError } = await db.from(table)
          .select("id", { head: true }).limit(1);
        return tableError;
      });
      if (unavailable) {
        setBackendIssue(unavailable);
        setBackendStatus("unavailable");
        return;
      }

      stage = "device";
      if (!navigator.mediaDevices?.getUserMedia) {
        throw Object.assign(new Error("A captura de vídeo não está disponível nesta aba."), { name: "SecurityError" });
      }

      // Simple constraints work better in Safari/iOS than device-specific
      // camera/facing-mode requirements. Existing browser grants are reused.
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (deviceError) {
        if (!isMissingMediaDevice(deviceError)) throw deviceError;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          toast.info("Microfone indisponível. A live será iniciada somente com vídeo.");
        } catch (cameraError) {
          if (!isMissingMediaDevice(cameraError)) throw cameraError;
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          toast.info("Câmera indisponível. A live será iniciada somente com áudio.");
        }
      }

      stage = "server";
      const { data, error: insertError } = await db.from("community_live_sessions")
        .insert({
          host_id: user.id, title: name, room_name: "CaminhoDivino-" + crypto.randomUUID(),
          status: "live",
          // Do not display a not-yet-connected stream as live.
          last_heartbeat_at: new Date(Date.now() - 120_000).toISOString(),
        })
        .select("id,host_id,title,room_name,status,last_heartbeat_at").single();
      if (insertError || !data) throw insertError ?? new Error("Não foi possível registrar a live.");

      localMedia.current = stream;
      stream = null;
      const newRoom: Room = { session: data as Session, role: "host" };
      liveRoom.current = newRoom;
      setRoom(newRoom);
      setConnected(false);
      setCreateOpen(false);
      setMicOn((localMedia.current?.getAudioTracks().length ?? 0) > 0);
      setCameraOn((localMedia.current?.getVideoTracks().length ?? 0) > 0);
      setHasVideoTrack((localMedia.current?.getVideoTracks().length ?? 0) > 0);
    } catch (issue) {
      stream?.getTracks().forEach((track) => track.stop());
      const message = stage === "device"
        ? explainLiveMediaError(issue)
        : explainLiveBackendError(issue);
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function joinLive(session: Session) {
    if (!user || busy || liveRoom.current) return;
    setBusy(true);
    setError(null);
    try {
      if (session.host_id === user.id) {
        throw new Error("Esta live foi iniciada por você em outra janela. Volte à janela da transmissão.");
      }
      const { data: existing, error: readError } = await db.from("community_live_participants")
        .select("status").eq("session_id", session.id).eq("user_id", user.id).maybeSingle();
      if (readError) throw readError;
      if (existing?.status === "kicked") {
        throw new Error("O organizador removeu sua participação nesta transmissão.");
      }
      const result = existing
        ? await db.from("community_live_participants")
          .update({ status: "joined", updated_at: new Date().toISOString() })
          .eq("session_id", session.id).eq("user_id", user.id)
          .eq("status", "left")
        : await db.from("community_live_participants")
          .insert({ session_id: session.id, user_id: user.id, status: "joined" });
      if (result.error) throw result.error;
      const newRoom: Room = { session, role: "viewer" };
      liveRoom.current = newRoom;
      setRoom(newRoom);
      setConnected(false);
      setJoining(true);
    } catch (issue) {
      setError(errorMessage(issue));
      toast.error(explainLiveBackendError(issue));
    } finally {
      setBusy(false);
    }
  }

  function toggleMicrophone() {
    const audio = localMedia.current?.getAudioTracks() ?? [];
    if (!audio.length) return;
    const next = !audio[0]?.enabled;
    audio.forEach((track) => { track.enabled = next; });
    setMicOn(next);
  }

  function toggleCamera() {
    const video = localMedia.current?.getVideoTracks() ?? [];
    if (!video.length) return;
    const next = !video[0]?.enabled;
    video.forEach((track) => { track.enabled = next; });
    setCameraOn(next);
  }

  async function kickMember(memberId: string) {
    const active = liveRoom.current;
    if (!active || active.role !== "host" || !user) return;
    if (!window.confirm("Remover esta pessoa da transmissão? Ela não poderá voltar nesta live.")) return;
    const { error: kickError } = await db.from("community_live_participants")
      .update({ status: "kicked", updated_at: new Date().toISOString() })
      .eq("session_id", active.session.id).eq("user_id", memberId).eq("status", "joined");
    if (kickError) { toast.error("Não foi possível remover o participante."); return; }
    peers.current.get(memberId)?.close();
    peers.current.delete(memberId);
    await loadMembers(active.session.id);
    toast.success("Participante removido da transmissão.");
  }

  useEffect(() => {
    if (!room || !user) return;
    let cancelled = false;
    const { session, role } = room;
    const myId = user.id;
    const currentRoomId = session.id;
    const amHost = role === "host";
    const signalChannel = db.channel("cd-native-live-" + currentRoomId + "-" + myId);
    channel.current = signalChannel;

    async function send(kind: Signal["kind"], to: string, payload: Record<string, unknown> = {}) {
      if (cancelled || liveRoom.current?.session.id !== currentRoomId) return;
      const { error: signalError } = await db.from("community_live_signals").insert({
        session_id: currentRoomId,
        sender_id: myId,
        receiver_id: to,
        kind,
        payload,
      });
      if (signalError) throw signalError;
    }

    async function flushCandidates(peerId: string, peer: RTCPeerConnection) {
      const queued = pendingCandidates.current.get(peerId) ?? [];
      pendingCandidates.current.delete(peerId);
      for (const ice of queued) await peer.addIceCandidate(ice);
    }

    function createPeer(peerId: string, host: boolean) {
      peers.current.get(peerId)?.close();
      const peer = new RTCPeerConnection(ICE);
      peers.current.set(peerId, peer);
      peer.onicecandidate = (event) => {
        if (event.candidate && !cancelled) {
          void send("candidate", peerId, { candidate: event.candidate.toJSON() })
            .catch(() => setError("Falha na negociação de vídeo. Verifique sua conexão."));
        }
      };
      peer.onconnectionstatechange = () => {
        if (cancelled) return;
        if (peer.connectionState === "failed") {
          setError("Não foi possível estabelecer o vídeo nesta rede. Uma conexão TURN pode ser necessária.");
          if (!host) setJoining(false);
        } else if (peer.connectionState === "connected" && !host) {
          setJoining(false);
          setConnected(true);
          setError(null);
        }
      };
      if (host) {
        localMedia.current?.getTracks().forEach((track) => {
          if (localMedia.current) peer.addTrack(track, localMedia.current);
        });
      } else {
        peer.ontrack = (event) => {
          if (!remoteVideo.current) return;
          remoteVideo.current.srcObject = event.streams[0] ?? new MediaStream([event.track]);
          void remoteVideo.current.play().then(() => setPlayBlocked(false))
            .catch(() => setPlayBlocked(true));
          setJoining(false);
          setConnected(true);
        };
      }
      return peer;
    }

    async function isJoined(viewerId: string) {
      const { data, error: resultError } = await db.from("community_live_participants")
        .select("status").eq("session_id", currentRoomId).eq("user_id", viewerId).maybeSingle();
      return !resultError && data?.status === "joined";
    }

    async function processSignal(signal: Signal) {
      if (cancelled || liveRoom.current?.session.id !== currentRoomId) return;
      if (signal.session_id !== currentRoomId || signal.receiver_id !== myId) return;
      if (processed.current.has(signal.id)) return;
      processed.current.add(signal.id);
      if (processed.current.size > 1000) processed.current.clear();
      const from = signal.sender_id;
      const payload = signal.payload ?? {};
      if (!amHost && from !== session.host_id) return;
      if (amHost && !(await isJoined(from))) return;

      try {
        if (signal.kind === "join" && amHost) {
          const peer = createPeer(from, true);
          await peer.setLocalDescription(await peer.createOffer());
          await send("offer", from, { sdp: peer.localDescription?.toJSON() });
          void loadMembers(currentRoomId);
        } else if (signal.kind === "offer" && !amHost) {
          const sdp = payload["sdp"] as RTCSessionDescriptionInit | undefined;
          if (!sdp || sdp.type !== "offer" || typeof sdp.sdp !== "string") return;
          const peer = createPeer(from, false);
          await peer.setRemoteDescription(sdp);
          await flushCandidates(from, peer);
          await peer.setLocalDescription(await peer.createAnswer());
          await send("answer", from, { sdp: peer.localDescription?.toJSON() });
        } else if (signal.kind === "answer" && amHost) {
          const sdp = payload["sdp"] as RTCSessionDescriptionInit | undefined;
          const peer = peers.current.get(from);
          if (peer && sdp?.type === "answer" && typeof sdp.sdp === "string") {
            await peer.setRemoteDescription(sdp);
            await flushCandidates(from, peer);
          }
        } else if (signal.kind === "candidate") {
          const candidate = payload["candidate"] as RTCIceCandidateInit | undefined;
          if (!candidate || typeof candidate.candidate !== "string") return;
          const peer = peers.current.get(from);
          if (peer?.remoteDescription) await peer.addIceCandidate(candidate);
          else pendingCandidates.current.set(from, [...(pendingCandidates.current.get(from) ?? []), candidate]);
        } else if (signal.kind === "leave" && amHost) {
          peers.current.get(from)?.close();
          peers.current.delete(from);
          void loadMembers(currentRoomId);
        }
      } catch (issue) {
        if (!cancelled) setError("Falha ao conectar vídeo: " + errorMessage(issue));
      }
    }

    signalChannel
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "community_live_signals",
        filter: "receiver_id=eq." + myId,
      }, (message) => {
        void processSignal(message.new as Signal);
      })
      .on("postgres_changes", {
        event: "*", schema: "public", table: "community_live_participants",
        filter: "session_id=eq." + currentRoomId,
      }, (change) => {
        if (cancelled || liveRoom.current?.session.id !== currentRoomId) return;
        const member = change.new as Member | undefined;
        if (amHost) {
          void loadMembers(currentRoomId);
          if (member?.status === "kicked" || member?.status === "left") {
            peers.current.get(member.user_id)?.close();
            peers.current.delete(member.user_id);
          }
        } else if (member?.user_id === myId && member.status === "kicked") {
          toast.error("O organizador removeu você desta live.");
          void leaveRoom();
        }
      })
      .subscribe((status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          if (amHost) {
            void (async () => {
              const { error: activationError } = await db.from("community_live_sessions")
                .update({ last_heartbeat_at: new Date().toISOString() })
                .eq("id", currentRoomId).eq("host_id", myId);
              if (cancelled) return;
              if (activationError) {
                setError("A live não pôde ser ativada. Verifique as tabelas e as permissões do Supabase.");
                return;
              }
              setConnected(true);
              setJoining(false);
              void loadSessions();
              void loadMembers(currentRoomId);
              heartbeatTimer.current = window.setInterval(() => {
                void db.from("community_live_sessions")
                  .update({ last_heartbeat_at: new Date().toISOString() })
                  .eq("id", currentRoomId).eq("host_id", myId);
              }, 15_000);
            })();
          } else {
            void send("join", session.host_id).catch(() => {
              setError("Não foi possível comunicar sua entrada ao anfitrião.");
              setJoining(false);
            });
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setError("A conexão em tempo real falhou. Verifique sua internet.");
          setJoining(false);
        }
      });

    memberTimer.current = window.setInterval(() => {
      if (cancelled) return;
      if (amHost) {
        void (async () => {
          await loadMembers(currentRoomId);
          const { data } = await db.from("community_live_participants")
            .select("user_id,status").eq("session_id",currentRoomId);
          const joined = new Set(((data ?? []) as Member[]).filter(p => p.status === "joined").map(p => p.user_id));
          for (const [id, peer] of peers.current) {
            if (!joined.has(id)) { peer.close(); peers.current.delete(id); }
          }
        })();
      } else {
        void (async () => {
          const [membership, activeSession] = await Promise.all([
            db.from("community_live_participants").select("status")
              .eq("session_id", currentRoomId).eq("user_id", myId).maybeSingle(),
            db.from("community_live_sessions").select("status,last_heartbeat_at")
              .eq("id", currentRoomId).maybeSingle(),
          ]);
          if (cancelled) return;
          const currentState = membership.data?.status;
          const liveStatus = activeSession.data;
          if (currentState === "kicked") {
            toast.error("O organizador removeu você desta live.");
            void leaveRoom();
          } else if (!liveStatus || liveStatus.status !== "live" ||
            Date.now() - new Date(liveStatus.last_heartbeat_at).getTime() > 55_000) {
            toast.info("A transmissão foi encerrada.");
            void leaveRoom();
          }
        })();
      }
    }, 5_000);

    return () => {
      cancelled = true;
      if (heartbeatTimer.current !== null) window.clearInterval(heartbeatTimer.current);
      if (memberTimer.current !== null) window.clearInterval(memberTimer.current);
      heartbeatTimer.current = null;
      memberTimer.current = null;
      void db.removeChannel(signalChannel);
      if (channel.current === signalChannel) channel.current = null;
      closePeers();
      // Also handle browser navigation away from the live without leaving a ghost session.
      if (liveRoom.current?.session.id === currentRoomId) {
        liveRoom.current = null;
        localMedia.current?.getTracks().forEach((track) => track.stop());
        localMedia.current = null;
        if (amHost) {
          void (async () => {
            const { error: endError } = await db.from("community_live_sessions")
              .update({ status: "ended", ended_at: new Date().toISOString() })
              .eq("id", currentRoomId).eq("host_id", myId);
            if (!endError) {
              await db.from("community_live_signals").delete()
                .eq("session_id", currentRoomId);
            }
          })();
        } else {
          void db.from("community_live_participants")
            .update({ status: "left", updated_at: new Date().toISOString() })
            .eq("session_id", currentRoomId).eq("user_id", myId).eq("status", "joined");
        }
      }
    };
    // The signaling session starts once per room and is not remounted by UI updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.session.id, room?.role, user?.id]);

  async function enablePlayback() {
    if (!remoteVideo.current) return;
    try {
      await remoteVideo.current.play();
      setPlayBlocked(false);
    } catch {
      toast.error("Toque no controle de reprodução do vídeo para ativar o som.");
    }
  }

  return (
    <section id="community-live" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-lg font-bold text-[#102c55] dark:text-foreground">
          <Radio className="size-5 text-amber-500" /> Lives da Comunidade
        </h3>
        <button type="button" onClick={() => setCreateOpen((value) => !value)}
          disabled={Boolean(room) || backendStatus !== "ready"}
          aria-describedby={backendStatus === "unavailable" ? "community-live-infrastructure-notice" : undefined}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-blue-300 bg-white px-4 text-sm font-semibold text-blue-800 shadow-sm hover:bg-blue-50 disabled:opacity-50 dark:bg-card dark:text-blue-300">
          <Plus className="size-4" /> Iniciar minha live
        </button>
      </div>

      {backendStatus === "checking" && (
        <p className="text-sm text-slate-600 dark:text-slate-300" role="status">
          Verificando a disponibilidade das transmissões…
        </p>
      )}
      {backendStatus === "unavailable" && backendIssue && (
        <div id="community-live-infrastructure-notice"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
          role="status">
          <span className="min-w-0 flex-1">{backendIssue}</span>
          <button type="button" onClick={() => void verifyInfrastructure()}
            className="min-h-10 shrink-0 rounded-full border border-amber-500 px-4 font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40">
            Verificar novamente
          </button>
        </div>
      )}

      {createOpen && !room && backendStatus === "ready" && (
        <form onSubmit={(event) => { event.preventDefault(); void startLive(); }}
          className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:bg-slate-900">
          <label className="block space-y-2 text-sm font-semibold">
            Qual é o tema da sua live?
            <input value={topic} onChange={(event) => setTopic(event.target.value)}
              minLength={5} maxLength={90} required
              placeholder="Pregação, Culto da Comunhão, Oração, Testemunho..."
              className="min-h-12 w-full rounded-xl border border-blue-200 bg-white px-3 text-base text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600" />
          </label>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Sua conta do Caminho Divino é suficiente. Se a câmera e o microfone já estão autorizados, o navegador reutiliza essa permissão. Não há login externo de anfitrião.
          </p>
          <div className="flex gap-2">
            <button type="submit" disabled={busy || !user}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Radio className="size-4" />}
              {busy ? "Iniciando…" : "Iniciar transmissão"}
            </button>
            <button type="button" onClick={() => setCreateOpen(false)}
              className="min-h-11 rounded-full border border-blue-200 px-4 text-sm">Cancelar</button>
          </div>
        </form>
      )}

      {sessions.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-300">
            <span className="size-2 animate-pulse rounded-full bg-red-600" /> AO VIVO AGORA
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <button key={session.id} type="button" disabled={busy || Boolean(room)}
                onClick={() => void joinLive(session)}
                className="flex min-h-20 items-center gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-[#0b3768] to-[#0b67a9] p-4 text-left text-white shadow-md disabled:opacity-60">
                <Radio className="size-7 shrink-0 text-amber-300" />
                <span className="min-w-0 flex-1">
                  <span className="block break-words font-bold">{session.title}</span>
                  <span className="text-xs text-blue-100">Entrar e assistir · sem pedir autorização</span>
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
              <p className="truncate text-sm font-bold">{room.session.title}</p>
              <p className="text-xs text-blue-100">
                {room.role === "host" ? "Você está transmitindo" : "Assistindo à live"}
              </p>
            </div>
            <button type="button" onClick={() => void leaveRoom()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/40 px-3 text-sm hover:bg-white/10">
              <X className="size-4" />
              {room.role === "host" ? "Encerrar live" : "Sair da live"}
            </button>
          </div>
          {room.role === "host" ? (
            <>
              {!hasVideoTrack && (
                <p className="rounded-xl border border-white/20 p-3 text-sm text-white">Transmissão apenas com áudio — câmera indisponível neste dispositivo.</p>
              )}
              <video ref={localVideo} muted playsInline autoPlay
                aria-label="Prévia da sua câmera" className="aspect-video max-h-[65svh] w-full rounded-xl bg-black object-contain" />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={toggleMicrophone}
                  className="flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-4 text-sm">
                  {micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
                  {micOn ? "Desligar microfone" : "Ligar microfone"}
                </button>
                <button type="button" onClick={toggleCamera}
                  className="flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-4 text-sm">
                  {cameraOn ? <Camera className="size-4" /> : <CameraOff className="size-4" />}
                  {cameraOn ? "Desligar câmera" : "Ligar câmera"}
                </button>
              </div>
              <div className="space-y-2 rounded-xl border border-white/20 p-3">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <UsersRound className="size-4" /> Participantes ({members.filter((item) => item.status === "joined").length})
                </h4>
                {members.filter((item) => item.status === "joined").length === 0 ? (
                  <p className="text-xs text-blue-100">Aguardando a entrada de participantes.</p>
                ) : members.filter((item) => item.status === "joined").map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between gap-3 rounded-lg bg-white/10 p-2">
                    <span className="min-w-0 truncate text-xs">{memberNames[member.user_id] || "Membro " + member.user_id.slice(0, 8)}</span>
                    <button type="button" onClick={() => void kickMember(member.user_id)}
                      className="flex min-h-10 items-center gap-1 rounded-lg border border-red-200/40 px-3 text-xs text-white hover:bg-red-700">
                      <ShieldBan className="size-4" /> Remover
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <video ref={remoteVideo} playsInline autoPlay controls
                aria-label="Vídeo da transmissão" className="aspect-video max-h-[65svh] w-full rounded-xl bg-black object-contain" />
              {joining && <p className="flex items-center gap-2 text-xs text-blue-100">
                <Loader2 className="size-4 animate-spin" /> Entrando automaticamente na transmissão…
              </p>}
              {playBlocked && <button type="button" onClick={() => void enablePlayback()}
                className="min-h-11 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white">
                <Play className="mr-2 inline size-4" /> Ativar som e vídeo
              </button>}
            </>
          )}
          {connected && <p className="text-xs text-blue-100">
            {room.role === "host"
              ? "Transmissão ativa. Os participantes podem entrar sem aguardar aprovação."
              : "Conexão estabelecida. O microfone e a câmera do espectador permanecem desativados."}
          </p>}
        </div>
      )}
      {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
    </section>
  );
}
