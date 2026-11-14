import { useCallback, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BookOpen, Camera, HeartHandshake, MessageCircle, PenLine, Play, Radio,
  UsersRound, UserRoundPlus, Video, ChevronRight, Sparkles, HandHeart,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { GlobalChatPanel } from "@/components/community/GlobalChatPanel";
import { CommunityStories } from "@/components/community/CommunityStories";
import { CommunityLivePanel } from "@/components/community/CommunityLivePanel";
import { CommunityGroupsPanel } from "@/components/community/CommunityGroupsPanel";

type ComposerKind = "reflexao" | "testemunho" | "oracao" | "debate";
const shortcutClass = "flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 rounded-[1.2rem] border border-blue-300/30 bg-gradient-to-b from-[#124f88] to-[#082b55] px-2 py-3 text-center text-white shadow-[0_3px_12px_rgba(4,52,103,.25)] transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400";
const iconClass = "size-7 text-amber-300";
export function CommunitySocialHub({ user, onCompose }: {
  user: User | null;
  onCompose: (kind: ComposerKind, media?: "video" | "image") => void;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [liveRequested, setLiveRequested] = useState(false);
  const clearLiveRequest = useCallback(() => setLiveRequested(false), []);

  function showChat() {
    setChatOpen((v) => !v);
  }
  function goGroups() {
    document.getElementById("community-groups")?.scrollIntoView({ behavior:"smooth",block:"start" });
  }
  function goStories() {
    document.getElementById("community-stories")?.scrollIntoView({ behavior:"smooth",block:"start" });
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="relative isolate overflow-hidden rounded-[1.6rem] border border-blue-300/25 bg-[#08254d] px-4 py-5 text-white shadow-[0_10px_30px_rgba(4,45,100,.2)] sm:px-7 sm:py-8">
        <img src="/images/prayer-sunrise.webp" alt="" aria-hidden="true"
          className="absolute inset-0 -z-20 size-full object-cover object-[65%_50%]" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#062a54]/95 via-[#0a3669]/75 to-[#0e3762]/20"/>
        <p className="mb-1 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
          <Sparkles className="size-3.5 text-amber-300" /> Conectados pela fé
        </p>
        <h1 className="font-serif text-3xl font-bold drop-shadow-md sm:text-4xl">Comunidade</h1>
        <p className="mt-1 max-w-lg text-sm leading-relaxed text-blue-50 sm:text-base">
          Conecte-se, compartilhe, converse e caminhe com irmãos na fé.
        </p>
      </section>

      <nav aria-label="Ações da comunidade" className="grid grid-cols-3 gap-2 rounded-[1.5rem] border border-blue-100 bg-white/95 p-2 shadow-md dark:border-slate-700 dark:bg-card sm:grid-cols-6">
        <button className={shortcutClass} type="button" onClick={() => onCompose("reflexao")}>
          <PenLine className={iconClass} aria-hidden="true"/><span className="text-xs font-bold">Publicar</span>
        </button>
        <button className={shortcutClass} type="button" onClick={() => onCompose("testemunho","video")}>
          <Video className={iconClass} aria-hidden="true"/><span className="text-xs font-bold">Vídeo até 1 min</span>
        </button>
        <button className={shortcutClass} type="button" onClick={() => {
          setLiveRequested(true);
          document.getElementById("community-live")?.scrollIntoView({ behavior:"smooth" });
        }}>
          <Radio className={iconClass} aria-hidden="true"/><span className="text-xs font-bold">Fazer live</span>
        </button>
        <button className={shortcutClass} type="button" onClick={goGroups}>
          <UsersRound className={iconClass} aria-hidden="true"/><span className="text-xs font-bold">Grupos</span>
        </button>
        <button className={shortcutClass} type="button" onClick={showChat} aria-expanded={chatOpen} aria-controls="community-global-chat">
          <MessageCircle className={iconClass} aria-hidden="true"/><span className="text-xs font-bold">Chat Global</span>
        </button>
        <Link to="/comunidade/privado" className={shortcutClass}>
          <UserRoundPlus className={iconClass} aria-hidden="true"/><span className="text-xs font-bold">Amizades</span>
        </Link>
      </nav>

      <CommunityStories user={user}/>

      <section className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={showChat} aria-expanded={chatOpen} aria-controls="community-global-chat"
          className="flex min-h-20 items-center gap-3 rounded-[1.3rem] border border-blue-200 bg-white p-3 text-left shadow-sm hover:bg-blue-50 dark:border-slate-700 dark:bg-card dark:hover:bg-slate-900">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white"><MessageCircle className="size-6"/></span>
          <span className="min-w-0 flex-1"><strong className="block text-base text-[#123c70] dark:text-foreground">Chat Global</strong>
            <span className="text-xs text-slate-600 dark:text-slate-300">Converse em tempo real com a comunidade</span></span>
          <ChevronRight className="size-5 shrink-0 text-blue-700" aria-hidden="true"/>
        </button>
        <Link to="/comunidade/privado" className="flex min-h-20 items-center gap-3 rounded-[1.3rem] border border-blue-200 bg-white p-3 text-left shadow-sm hover:bg-blue-50 dark:border-slate-700 dark:bg-card dark:hover:bg-slate-900">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white"><HeartHandshake className="size-6"/></span>
          <span className="min-w-0 flex-1"><strong className="block text-base text-[#123c70] dark:text-foreground">Conversas e Amizades</strong>
            <span className="text-xs text-slate-600 dark:text-slate-300">Pedidos de amizade e mensagens privadas</span></span>
          <ChevronRight className="size-5 shrink-0 text-blue-700" aria-hidden="true"/>
        </Link>
      </section>

      {chatOpen && <div id="community-global-chat" className="scroll-mt-24">
        <GlobalChatPanel />
      </div>}

      <CommunityLivePanel user={user} requestOpen={liveRequested} onRequestHandled={clearLiveRequest}/>

      <section aria-label="Formas de compartilhar" className="rounded-[1.5rem] border border-blue-100 bg-white/95 p-4 shadow-sm dark:border-slate-700 dark:bg-card">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#102c55] dark:text-foreground">
            <BookOpen className="size-5 text-blue-700" aria-hidden="true"/> Compartilhe sua caminhada
          </h2>
          <button type="button" onClick={()=>onCompose("reflexao")}
            className="hidden min-h-10 items-center gap-2 rounded-full bg-blue-700 px-4 text-xs font-bold text-white hover:bg-blue-800 sm:inline-flex">
            <PenLine className="size-4" /> Nova publicação
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Uma palavra, uma conquista, uma oração ou um testemunho.</p>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {[
            { icon: PenLine,label:"Reflexão", kind:"reflexao" as const },
            { icon: HandHeart,label:"Oração",kind:"oracao" as const },
            { icon: Camera,label:"Foto",kind:"testemunho" as const,media:"image" as const },
            { icon: Video,label:"Vídeo",kind:"testemunho" as const,media:"video" as const },
          ].map(({icon:Icon,label,kind,media})=>(
            <button key={label} type="button" onClick={()=>onCompose(kind,media)}
              className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border border-blue-100 bg-blue-50/60 p-2 text-xs font-semibold text-[#174471] hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-blue-600 dark:bg-slate-900 dark:text-blue-300">
              <Icon className="size-5 text-blue-700" aria-hidden="true" />{label}
            </button>
          ))}
        </div>
      </section>

      <CommunityGroupsPanel user={user}/>

      <button type="button" onClick={goStories}
        className="flex w-full items-center justify-between rounded-2xl border border-blue-100 bg-gradient-to-r from-[#0b376c] to-[#095d9b] p-3 text-left text-white shadow-sm">
        <span className="flex items-center gap-2"><Play className="size-4 text-amber-300" /> Histórias e momentos da comunidade</span>
        <ChevronRight className="size-5"/>
      </button>
    </div>
  );
}
