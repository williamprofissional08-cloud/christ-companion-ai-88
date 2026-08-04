import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getStudyContent } from "@/lib/ai.functions";
import { addFavorite } from "@/lib/app.functions";
import { getStudy } from "@/lib/content/studies";

export const Route = createFileRoute("/_authenticated/estudos/$slug")({
  head: () => ({
    meta: [
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
  const contentFn = useServerFn(getStudyContent);
  const favoriteFn = useServerFn(addFavorite);

  const content = useQuery({
    queryKey: ["study", slug],
    queryFn: () => contentFn({ data: { slug } }),
    staleTime: Infinity,
    enabled: Boolean(study),
  });

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

      {content.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : content.data ? (
        <div className="flex flex-col gap-4">
          <Card className="border-border/50 p-6 shadow-soft">
            <p className="text-sm leading-relaxed">{content.data.intro}</p>
          </Card>
          <Block label="Contexto histórico" text={content.data.historicalContext} />
          <Card className="border-border/50 p-6 shadow-soft">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              Pontos principais
            </p>
            <div className="mt-3 flex flex-col gap-4">
              {content.data.keyPoints.map((point) => (
                <div key={point.title}>
                  <p className="font-display text-base font-semibold">{point.title}</p>
                  <p className="mt-1 text-sm leading-relaxed">{point.text}</p>
                </div>
              ))}
            </div>
          </Card>
          <Block label="Aplicação prática" text={content.data.application} />
          <Card className="border-border/50 p-6 shadow-soft">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              Referências cruzadas
            </p>
            <ul className="mt-3 list-inside list-disc text-sm">
              {content.data.crossReferences.map((ref) => (
                <li key={ref}>{ref}</li>
              ))}
            </ul>
          </Card>
          <Card className="border-border/50 p-6 shadow-soft">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">
              Perguntas para reflexão
            </p>
            <ul className="mt-3 list-inside list-decimal text-sm leading-relaxed">
              {content.data.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </Card>
          <Block label="Conclusão" text={content.data.conclusion} />
          <Block label="Oração final" text={content.data.prayer} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Não conseguimos gerar este estudo agora. Tente novamente em instantes.
        </p>
      )}
    </AppShell>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <Card className="border-border/50 p-6 shadow-soft">
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">{label}</p>
      <p className="mt-2 text-sm leading-relaxed">{text}</p>
    </Card>
  );
}
