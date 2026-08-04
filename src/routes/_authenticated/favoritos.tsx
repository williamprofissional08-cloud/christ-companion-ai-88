import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listFavorites, removeFavorite } from "@/lib/app.functions";

export const Route = createFileRoute("/_authenticated/favoritos")({
  head: () => ({
    meta: [
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
  { key: "todos", label: "Todos" },
  { key: "versiculo", label: "Versículos" },
  { key: "estudo", label: "Estudos" },
  { key: "devocional", label: "Devocionais" },
  { key: "oracao", label: "Orações" },
];

function FavoritosPage() {
  const queryClient = useQueryClient();
  const list = useServerFn(listFavorites);
  const remove = useServerFn(removeFavorite);
  const [filter, setFilter] = useState("todos");

  const favorites = useQuery({ queryKey: ["favorites"], queryFn: () => list({}) });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites"] }),
  });

  const items = (favorites.data ?? []).filter(
    (item) => filter === "todos" || item.kind === filter,
  );

  return (
    <AppShell title="Favoritos" subtitle="Tudo o que você guardou, sincronizado na nuvem.">
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "gold" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {favorites.isLoading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : items.length ? (
          items.map((item) => (
            <Card key={item.id} className="border-border/50 p-5 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                    {item.kind}
                  </p>
                  <h2 className="mt-1 font-display text-lg font-semibold">{item.reference}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remover favorito"
                  onClick={() => del.mutate(item.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              {item.content ? (
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>
              ) : null}
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum favorito ainda. Toque na estrela ao ler a Bíblia ou um estudo.
          </p>
        )}
      </div>
    </AppShell>
  );
}
