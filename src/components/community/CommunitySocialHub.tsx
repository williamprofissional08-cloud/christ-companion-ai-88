import { useCallback, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BookOpen, Camera, ChevronDown, HeartHandshake, MessageCircle, PenLine,
  Radio, UsersRound, Video, HandHeart,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { GlobalChatPanel } from "@/components/community/GlobalChatPanel";
import { CommunityStories } from "@/components/community/CommunityStories";
import { CommunityLivePanel } from "@/components/community/CommunityLivePanel";

type ComposerKind = "reflexao" | "testemunho" | "oracao" | "debate";

export function CommunitySocialHub({ user, onCompose }: {
  user: User | null;
  onCompose: (kind: ComposerKind, media?: "video" | "image") => void;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [liveRequested, setLiveRequested] = useState(false);
  const clearLiveRequest = useCallback(() => setLiveRequested(false), []);

  function goGroups() {
    document.getElementById("community-groups")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const primaryAction = "flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white p-3 text-center text-sm font-semibold text-[#163e68] shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-primary dark:border-slate-700 dark:bg-card dark:text-blue-100";
  const primaryIcon = "size-6 text-blue-700 dark:text-blue-300";
  const extraAction = "flex min-h-11 items-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary";

  return (
    <div className="space-y-4">
      <header className="rounded-3xl border border-blue-100 bg-gradient-to-r from-[#10375f] to-[#245b85] p-5 text-white shadow-sm sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">Caminhe com outros na fé</p>
        <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">Comunidade</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-50">
          Um espaço para compartilhar, conversar e encontrar pessoas que caminham com você.
        </p>
      </header>

      <nav aria-label="Ações principais da comunidade" className="grid grid-cols-3 gap-2 sm:gap-3">
        <button type="button" onClick={() => onCompose("reflexao")} className={primaryAction}>
          <PenLine aria-hidden="true" className={primaryIcon} />
          <span>Publicar</span>
        </button>
        <button
          type="button"
          aria-expanded={chatOpen}
          aria-controls="community-global-chat"
          onClick={() => setChatOpen((open) => !open)}
          className={primaryAction}
        >
          <MessageCircle aria-hidden="true" className={primaryIcon} />
          <span>Chat global</span>
        </button>
        <Link to="/comunidade/privado" className={primaryAction}>
          <HeartHandshake aria-hidden="true" className={primaryIcon} />
          <span>Amizades</span>
        </Link>
      </nav>

      {chatOpen ? (
        <section id="community-global-chat" className="scroll-mt-24" aria-label="Conversa global">
          <GlobalChatPanel />
        </section>
      ) : null}

      <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
            <BookOpen aria-hidden="true" className="size-5" />
          </span>
          <div className="flex-1">
            <h2 className="font-display text-base font-semibold">Compartilhe sua caminhada</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Uma reflexão bíblica, um pedido de oração ou um testemunho.
            </p>
            <button
              type="button"
              onClick={() => onCompose("oracao")}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-primary hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              <HandHeart aria-hidden="true" className="size-4" /> Pedir oração
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <button
          type="button"
          aria-expanded={extrasOpen}
          aria-controls="community-extra-features"
          onClick={() => setExtrasOpen((open) => !open)}
          className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span>Mais recursos da comunidade</span>
          <ChevronDown aria-hidden="true" className={"size-5 transition-transform " + (extrasOpen ? "rotate-180" : "")} />
        </button>
        {extrasOpen ? (
          <div id="community-extra-features" className="space-y-4 border-t border-border/70 p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Explore stories, grupos, vídeos e transmissões. Algumas experiências ainda estão em avaliação para o beta.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button type="button" onClick={() => onCompose("testemunho", "image")} className={extraAction}>
                <Camera aria-hidden="true" className="size-4" /> Publicar foto
              </button>
              <button type="button" onClick={() => onCompose("testemunho", "video")} className={extraAction}>
                <Video aria-hidden="true" className="size-4" /> Publicar vídeo
              </button>
              <button type="button" onClick={goGroups} className={extraAction}>
                <UsersRound aria-hidden="true" className="size-4" /> Ver grupos
              </button>
              <button type="button" onClick={() => setLiveRequested(true)} className={extraAction}>
                <Radio aria-hidden="true" className="size-4" /> Transmissões
              </button>
            </div>
            <CommunityStories user={user} />
            <CommunityLivePanel
              user={user}
              requestOpen={liveRequested}
              onRequestHandled={clearLiveRequest}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
