import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Bot, GraduationCap, Route as RouteIcon, Share2, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { getDevotional } from "@/lib/ai.functions";
import { loadDevotionalSafely } from "@/lib/devotional-loader";
import { todayISO } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início | Caminho Divino" },
      { name: "description", content: "Sua jornada diária com a Palavra de Deus." },
      { property: "og:title", content: "Caminho Divino" },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const day = todayISO();
  const { user } = useAuth();
  const devotionalFn = useServerFn(getDevotional);
  const devotional = useQuery({
    queryKey: ["devotional", day],
    queryFn: () => loadDevotionalSafely(day, () => devotionalFn({ data: { day } })),
    retry: false,
    staleTime: Infinity,
  });

  const metadata = user?.user_metadata ?? {};
  const rawDisplayName = String(metadata["full_name"] ?? metadata["name"] ?? user?.email?.split("@")[0] ?? "William");
  const displayName = rawDisplayName.trim().split(/\s+/)[0] || "William";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const d = devotional.data;

  async function shareVerse() {
    const verseText = d?.verse.text ?? "A tua palavra é lâmpada para os meus pés e luz para o meu caminho.";
    const reference = d?.verse.reference ?? "Salmos 119:105";
    const text = `${verseText} — ${reference}\nCaminho Divino`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Versículo do dia", text });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        toast.success("Versículo copiado para compartilhar.");
      } else {
        toast.error("O compartilhamento não está disponível neste dispositivo.");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") toast.error("Não foi possível compartilhar agora.");
    }
  }

  return (
    <AppShell title="Caminho Divino" homeHeader>
      <div className="mx-auto max-w-2xl space-y-5 pb-3">
        <section className="px-1 pt-1">
          <h1 className="font-display text-[1.8rem] font-bold tracking-tight text-[#142d59] dark:text-foreground sm:text-3xl">{greeting}, {displayName}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-muted-foreground">Que a Palavra guie o seu dia.</p>
        </section>

        <Card className="overflow-hidden rounded-[1.65rem] border border-blue-100/80 bg-gradient-to-br from-[#dcecff] via-[#f5f9ff] to-[#fff8e9] p-0 shadow-[0_12px_30px_-20px_rgba(30,75,135,0.45)] dark:border-blue-900 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950">
          <div className="p-5 sm:p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#173f7c] px-3.5 py-2 text-[11px] font-bold tracking-[0.14em] text-white">
              <BookOpen className="size-4" aria-hidden /> VERSÍCULO DO DIA
            </div>
            {devotional.isLoading ? (
              <div className="mt-5 space-y-3"><Skeleton className="h-7 w-full" /><Skeleton className="h-7 w-4/5" /><Skeleton className="h-4 w-28" /></div>
            ) : d ? (
              <>
                <blockquote className="mt-5 font-display text-[1.45rem] font-semibold leading-snug text-[#142d59] dark:text-white sm:text-2xl">“{d.verse.text}”</blockquote>
                <p className="mt-3 text-sm font-bold text-[#2462b5] dark:text-blue-300">{d.verse.reference}</p>
                <div className="mt-5 rounded-2xl border border-white/70 bg-white/75 p-4 text-sm leading-relaxed text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 size-5 shrink-0 text-[#2868c5]" aria-hidden />
                    <p>{d.motivational || "Deus ilumina cada passo quando caminhamos com confiança."}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <blockquote className="mt-5 font-display text-[1.45rem] font-semibold leading-snug text-[#142d59] dark:text-white sm:text-2xl">“A tua palavra é lâmpada para os meus pés e luz para o meu caminho.”</blockquote>
                <p className="mt-3 text-sm font-bold text-[#2462b5] dark:text-blue-300">Salmos 119:105</p>
                <p className="mt-5 rounded-2xl bg-white/75 p-4 text-sm leading-relaxed text-slate-700 dark:bg-slate-800 dark:text-slate-200">Deus ilumina cada passo quando caminhamos com confiança.</p>
              </>
            )}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[1.15fr_0.85fr]">
              <Button asChild className="h-12 rounded-xl bg-[#2464c5] text-sm font-semibold text-white shadow-sm hover:bg-[#1c52a5]">
                <Link to="/devocional"><BookOpen className="mr-2 size-4" aria-hidden />Ler reflexão</Link>
              </Button>
              <Button type="button" variant="outline" onClick={shareVerse} className="h-12 rounded-xl border-blue-200 bg-white/80 text-sm font-semibold text-[#173f7c] hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-800 dark:text-blue-100">
                <Share2 className="mr-2 size-4" aria-hidden />Compartilhar
              </Button>
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-card">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#2464c5] dark:bg-blue-950"><Trophy className="size-6" aria-hidden /></div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-bold text-[#142d59] dark:text-foreground">Desafio de hoje</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-muted-foreground">{d?.challenge || "Leia o versículo e pratique uma atitude de fé."}</p>
          </div>
        </Card>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold tracking-tight text-[#142d59] dark:text-foreground">Continue sua jornada</h2>
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <Link to="/assistente" className="group flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-white px-2 py-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-card">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-[#2464c5] dark:bg-blue-950"><Bot className="size-6" aria-hidden /></span>
              <span className="text-xs font-semibold text-[#17345f] dark:text-foreground sm:text-sm">Assistente</span>
            </Link>
            <Link to="/trilhas" className="group flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-white px-2 py-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-card">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-[#2464c5] dark:bg-blue-950"><RouteIcon className="size-6" aria-hidden /></span>
              <span className="text-xs font-semibold text-[#17345f] dark:text-foreground sm:text-sm">Trilhas guiadas</span>
            </Link>
            <Link to="/escola" className="group flex min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-white px-2 py-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-card">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-[#2464c5] dark:bg-blue-950"><GraduationCap className="size-6" aria-hidden /></span>
              <span className="text-xs font-semibold text-[#17345f] dark:text-foreground sm:text-sm">Escola Bíblica</span>
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
