import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookOpen, GraduationCap, Heart, MessageCircle, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listFavorites, removeFavorite } from "@/lib/app.functions";

export const Route = createFileRoute("/_authenticated/favoritos")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Favoritos — Caminhando com Cristo" },
      {
        name: "description",
        content: "Seus versículos, estudos e orações favoritos salvos e sincronizados na nuvem.",
      },
      { property: "og:title", content: "Favoritos" },
      { property: "og:description", content: "Volte sempre ao que tocou seu coração." },
    ],
  }),
  component: FavoritosPage,
});

const FILTROS = [
  { key: "todos", label: "Todos", icon: Heart },
  { key: "versiculo", label: "Versículos", icon: BookOpen },
  { key: "estudo", label: "Estudos", icon: GraduationCap },
  { key: "devocional", label: "Devocionais", icon: Bookmark },
  { key: "oracao", label: "Orações", icon: MessageCircle },
];

function FavoritosPage() {
  const queryClient = useQueryClient();
  const list = useServerFn(listFavorites);
  const remove = useServerFn(removeFavorite);
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");

  const favorites = useQuery({ queryKey: ["favorites"], queryFn: () => list({}) });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });

  const items = useMemo(
    () =>
      (favorites.data ?? []).filter((item) => {
        const matchesFilter = filter === "todos" || item.kind === filter;
        const term = search.trim().toLocaleLowerCase();
        const matchesSearch = !term || `${item.reference} ${item.content ?? ""} ${item.kind}`.toLocaleLowerCase().includes(term);
        return matchesFilter && matchesSearch;
      }),
    [favorites.data, filter, search],
  );

  return (
    <AppShell title="Favoritos" subtitle="Tudo o que você guardou, sincronizado na nuvem.">
      <section className="mx-auto w-full max-w-6xl space-y-6 pb-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/[0.09] via-card to-amber-500/[0.07] px-5 py-6 shadow-soft sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-8 -top-12 size-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex size-11 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Heart className="size-5" aria-hidden="true" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Sua coleção</p>
              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Meus favoritos</h1>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">Um lugar especial para revisitar tudo o que falou ao seu coração.</p>
            </div>
            <div className="flex items-center gap-3 self-start rounded-2xl border border-border/60 bg-background/70 px-4 py-3 sm:self-auto">
              <Bookmark className="size-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <div><p className="text-xl font-bold leading-none">{favorites.data?.length ?? "—"}</p><p className="mt-1 text-xs text-muted-foreground">itens salvos</p></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
            <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Buscar nos favoritos</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar nos favoritos..."
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar favoritos por categoria">
            {FILTROS.map((f) => {
              const Icon = f.icon;
              const active = filter === f.key;
              return (
                <Button
                  key={f.key}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  aria-pressed={active}
                  onClick={() => setFilter(f.key)}
                  className={active ? "rounded-xl bg-primary text-primary-foreground shadow-sm" : "rounded-xl border-border/70 bg-card/70"}
                >
                  <Icon className="mr-1.5 size-4" aria-hidden="true" />{f.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <h2 className="font-display text-lg font-semibold">Conteúdos salvos</h2>
          {!favorites.isLoading && <span className="text-sm text-muted-foreground">{items.length} {items.length === 1 ? "item" : "itens"}</span>}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {favorites.isLoading ? (
            [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)
          ) : items.length ? (
            items.map((item) => (
              <Card key={item.id} className="group relative overflow-hidden rounded-2xl border-border/60 bg-card p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md sm:p-6">
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-500/70 to-primary/50 opacity-70" />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">{item.kind}</span>
                    <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-foreground">{item.reference}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remover ${item.reference} dos favoritos`}
                    disabled={del.isPending}
                    onClick={() => del.mutate(item.id)}
                    className="shrink-0 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
                {item.content ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.content}</p>
                ) : null}
                <div className="mt-5 flex items-center gap-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  <Bookmark className="size-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  <span>Salvo nos seus favoritos</span>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center rounded-3xl border border-dashed border-border/70 bg-card/60 px-6 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Heart className="size-6" aria-hidden="true" /></div>
              <h3 className="mt-4 font-display text-lg font-semibold">{search ? "Nenhum resultado encontrado" : "Sua coleção está começando"}</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">{search ? "Experimente outro termo ou escolha uma categoria diferente." : "Nenhum favorito ainda. Toque na estrela ao ler a Bíblia ou um estudo."}</p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
