import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ExportCard } from "@/components/ExportCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { buildSteps, getTrack } from "@/lib/content/tracks";
import { getTrackProgress, getTrackStepContent, saveTrackStep } from "@/lib/tracks.functions";
import { extractReferences } from "@/lib/scripture-refs";

export const Route = createFileRoute("/_authenticated/trilhas/$slug")({
  head: ({ params }) => {
    const track = getTrack(params.slug);
    const title = track ? `${track.title} — Trilha guiada` : "Trilha guiada";
    const description = track?.summary ?? "Trilha guiada de leitura bíblica por tema.";
    return {
      meta: [
        { title: `${title} | Caminhando com Cristo` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: TrilhaPage,
});

function TrilhaPage() {
  const { slug } = Route.useParams();
  const track = getTrack(slug);
  const steps = track ? buildSteps(track) : [];
  const queryClient = useQueryClient();
  const [active, setActive] = useState(1);
  const [note, setNote] = useState("");

  const fetchProgress = useServerFn(getTrackProgress);
  const fetchContent = useServerFn(getTrackStepContent);
  const persist = useServerFn(saveTrackStep);

  const progress = useQuery({
    queryKey: ["track-progress", slug],
    queryFn: () => fetchProgress({ data: { slug } }),
    enabled: Boolean(track),
  });

  const content = useQuery({
    queryKey: ["track-step", slug, active],
    queryFn: () => fetchContent({ data: { slug, step: active } }),
    enabled: Boolean(track),
    staleTime: Infinity,
  });

  const step = steps.find((s) => s.index === active);
  const completed = new Set<number>(progress.data?.completed_steps ?? []);
  const notes = (progress.data?.checkpoints ?? {}) as Record<string, string>;

  useEffect(() => {
    setNote(notes[String(active)] ?? "");
  }, [active, progress.data]);

  const mutation = useMutation({
    mutationFn: (input: { done: boolean; saveNote?: boolean }) =>
      persist({
        data: {
          slug,
          step: active,
          done: input.done,
          ...(input.saveNote ? { checkpoint: note } : {}),
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["track-progress", slug] });
      await queryClient.invalidateQueries({ queryKey: ["track-progress-all"] });
      toast.success("Progresso salvo.");
    },
    onError: () => toast.error("Não foi possível salvar agora."),
  });

  if (!track || !step) {
    return (
      <AppShell title="Trilha não encontrada">
        <Link to="/trilhas" className="text-sm text-primary underline">
          Voltar para as trilhas
        </Link>
      </AppShell>
    );
  }

  const isDone = completed.has(active);
  const references = content.data
    ? [
        ...new Set([
          ...(content.data.references ?? []),
          ...extractReferences(
            `${content.data.meditation} ${content.data.prayer} ${content.data.challenge}`,
          ),
        ]),
      ]
    : [];

  return (
    <AppShell title={track.title} subtitle={`${track.theme} · ${steps.length} etapas`}>
      <div className="space-y-4">
        <Card className="border-border/50 p-5 shadow-soft">
          <p className="text-sm text-muted-foreground">{track.summary}</p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{track.keyVerse}</p>
          <Progress value={(completed.size / steps.length) * 100} className="mt-4" />
          <div className="mt-4 flex flex-wrap gap-2">
            {steps.map((item) => (
              <button key={item.index} type="button" onClick={() => setActive(item.index)}>
                <Badge
                  variant={
                    item.index === active ? "default" : completed.has(item.index) ? "secondary" : "outline"
                  }
                  className="cursor-pointer gap-1 px-2.5 py-1"
                >
                  {completed.has(item.index) ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <Circle className="size-3.5" />
                  )}
                  {item.kind === "checkpoint"
                    ? `Checkpoint ${item.index}`
                    : item.kind === "revisao"
                      ? "Revisão"
                      : `Etapa ${item.index}`}
                </Badge>
              </button>
            ))}
          </div>
        </Card>

        {content.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : content.isError || !content.data ? (
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar esta etapa. Tente novamente em instantes.
          </p>
        ) : (
          <ExportCard filename={`trilha-${slug}-etapa-${active}`} title={content.data.title}>
            <div className="space-y-4">
              <Card className="animate-rise border-border/50 p-6 shadow-soft">
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                  {step.kind === "checkpoint"
                    ? "Checkpoint"
                    : step.kind === "revisao"
                      ? "Revisão final"
                      : `Etapa ${active} de ${steps.length}`}
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold">{content.data.title}</h2>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  Leitura: {content.data.reading}
                </p>
                <p className="mt-3 text-sm leading-relaxed">{content.data.readingSummary}</p>
              </Card>

              {[
                { label: "Meditação", text: content.data.meditation },
                { label: "Oração", text: content.data.prayer },
                { label: "Desafio", text: content.data.challenge },
              ].map((block) => (
                <Card key={block.label} className="animate-rise border-border/50 p-6 shadow-soft">
                  <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                    {block.label}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{block.text}</p>
                </Card>
              ))}

              <Card className="animate-rise border-border/50 p-6 shadow-soft">
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                  Perguntas do checkpoint
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {(content.data.questions ?? []).map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </Card>

              {references.length ? (
                <Card className="animate-rise border-border/50 p-6 shadow-soft">
                  <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                    Referências bíblicas usadas
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {references.map((reference) => (
                      <Badge key={reference} variant="secondary">
                        {reference}
                      </Badge>
                    ))}
                  </div>
                </Card>
              ) : null}
            </div>
          </ExportCard>
        )}

        <Card className="border-border/50 p-6 shadow-soft">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            Minhas anotações desta etapa
          </p>
          <Textarea
            value={note}
            maxLength={4000}
            onChange={(event) => setNote(event.target.value)}
            placeholder="O que Deus falou com você aqui?"
            className="mt-3 min-h-28"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ done: isDone, saveNote: true })}
            >
              Salvar anotação
            </Button>
            <Button
              size="sm"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate({ done: !isDone, saveNote: true })}
            >
              {isDone ? "Marcar como não concluída" : "Concluir etapa"}
            </Button>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            disabled={active === 1}
            onClick={() => setActive((s) => Math.max(1, s - 1))}
          >
            <ArrowLeft className="size-4" /> Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={active === steps.length}
            onClick={() => setActive((s) => Math.min(steps.length, s + 1))}
          >
            Próxima <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
