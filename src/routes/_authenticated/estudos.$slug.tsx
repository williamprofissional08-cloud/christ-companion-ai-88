import { useCallback, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { StudyReader, type ReaderCheckpoint } from "@/components/study/StudyReader";
import { getStudyCheckpoint, saveStudyCheckpoint } from "@/lib/study-progress.functions";
import { studySections } from "@/lib/study-sections";
import { STUDY_PLAYBACK_RATES, type StudyPlaybackRate } from "@/lib/study-reader";
import { Skeleton } from "@/components/ui/skeleton";
import { getStudyContent } from "@/lib/ai.functions";
import { addFavorite } from "@/lib/app.functions";
import { getStudy } from "@/lib/content/studies";
import { BIBLE_BOOKS, getChapterStudySlug } from "@/lib/content/bible-books";

export const Route = createFileRoute("/_authenticated/estudos/$slug")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Estudo bíblico — Caminhando com Cristo" },
      {
        name: "description",
        content: "Contexto histórico, pontos principais, aplicação prática, perguntas e oração final.",
      },
      { property: "og:title", content: "Estudo bíblico" },
      { property: "og:description", content: "Um estudo completo fundamentado nas Escrituras." },
    ],
  }),
  component: EstudoDetalhe,
});

function EstudoDetalhe() {
  const { slug } = Route.useParams();
  const study = getStudy(slug);
  const chapterStudy = study && "book" in study && "chapter" in study
    ? study
    : slug === "genesis-1-criacao" ? { book: BIBLE_BOOKS[0], chapter: 1 } : null;
  const contentFn = useServerFn(getStudyContent);
  const favoriteFn = useServerFn(addFavorite);
  const checkpointFn = useServerFn(getStudyCheckpoint);
  const saveCheckpointFn = useServerFn(saveStudyCheckpoint);
  const checkpoint = useQuery({
    queryKey: ["study-checkpoint", slug],
    queryFn: () => checkpointFn({ data: { slug } }),
    enabled: Boolean(study),
  });
  const persistCheckpoint = useCallback((value: ReaderCheckpoint) => {
    void saveCheckpointFn({ data: { slug, ...value } }).catch(() => {
      toast.error("Não foi possível salvar sua posição de leitura.", { id: "study-checkpoint-error" });
    });
  }, [saveCheckpointFn, slug]);

  const content = useQuery({
    queryKey: ["study", slug],
    queryFn: () => contentFn({ data: { slug } }),
    staleTime: Infinity,
    enabled: Boolean(study),
  });

  const sections = useMemo(() => content.data ? studySections(content.data) : [], [content.data]);

  const favorite = useMutation({
    mutationFn: () =>
      favoriteFn({
        data: { kind: "estudo", reference: study?.title ?? slug, content: study?.reference },
      }),
    onSuccess: () => toast.success("Estudo salvo nos favoritos."),
    onError: () => toast.error("Não foi possível favoritar."),
  });

  if (!study) {
    return (
      <AppShell title="Estudo não encontrado">
        <Button asChild variant="outline" size="sm">
          <Link to="/estudos">Voltar aos estudos</Link>
        </Button>
      </AppShell>
    );
  }

  return (
    <AppShell title={study.title} subtitle={`${study.category} · ${study.reference}`}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/estudos">
            <ArrowLeft className="size-4" /> Estudos
          </Link>
        </Button>
        {chapterStudy && chapterStudy.chapter > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link to="/estudos/$slug" params={{ slug: getChapterStudySlug(chapterStudy.book.slug, chapterStudy.chapter - 1) }}>
              Capítulo anterior
            </Link>
          </Button>
        ) : null}
        {chapterStudy && chapterStudy.chapter < chapterStudy.book.chapters ? (
          <Button asChild variant="outline" size="sm">
            <Link to="/estudos/$slug" params={{ slug: getChapterStudySlug(chapterStudy.book.slug, chapterStudy.chapter + 1) }}>
              Próximo capítulo
            </Link>
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => favorite.mutate()}
          disabled={favorite.isPending}
        >
          <Star className="size-4" /> Favoritar
        </Button>
      </div>

      {content.isLoading || checkpoint.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : content.data ? (
        <>
          {chapterStudy && slug !== "genesis-1-criacao" ? (
            <p className="mb-4 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
              Estudo de capítulo preparado com apoio de IA. Leia a passagem na Bíblia e confira as referências; interpretações e aplicações devem permanecer subordinadas ao texto bíblico.
            </p>
          ) : null}
        <StudyReader
          key={slug}
          title={study.title}
          reference={study.reference}
          depth={content.data.depth ?? study.depth}
          sections={sections}
          initialCheckpoint={checkpoint.data ? {
            ...checkpoint.data,
            playbackRate: STUDY_PLAYBACK_RATES.includes(checkpoint.data.playbackRate as StudyPlaybackRate)
              ? checkpoint.data.playbackRate as StudyPlaybackRate : 1,
          } : {}}
          onCheckpoint={persistCheckpoint}
        />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Não conseguimos gerar este estudo agora. Tente novamente em instantes.
        </p>
      )}
    </AppShell>
  );
}
