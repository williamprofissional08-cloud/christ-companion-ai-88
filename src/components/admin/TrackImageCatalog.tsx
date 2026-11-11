import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Image as ImageIcon, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { READING_TRACKS } from "@/lib/content/tracks";
import { getTrackImage, TRACK_IMAGE_CATALOG } from "@/lib/content/track-image-catalog";
import { listTrackImageAssignments, saveTrackImageAssignment } from "@/lib/tracks.functions";

const THEMES = ["Todas", ...TRACK_IMAGE_CATALOG.map((image) => image.theme)];

export function TrackImageCatalog() {
  const queryClient = useQueryClient();
  const listAssignments = useServerFn(listTrackImageAssignments);
  const saveAssignment = useServerFn(saveTrackImageAssignment);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["track-image-assignments"],
    queryFn: () => listAssignments(),
  });
  const [trackSlug, setTrackSlug] = useState(READING_TRACKS[0]?.slug ?? "");
  const [theme, setTheme] = useState("Todas");
  const [search, setSearch] = useState("");
  const [selectedImageId, setSelectedImageId] = useState("");

  const assignments = useMemo(
    () => Object.fromEntries(data.map((item) => [item.track_slug, item.image_id])),
    [data],
  );
  const track = READING_TRACKS.find((item) => item.slug === trackSlug) ?? READING_TRACKS[0];
  const currentImage = track ? getTrackImage(track.slug, track.theme, assignments) : undefined;
  const visibleImages = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return TRACK_IMAGE_CATALOG.filter((image) => {
      const themeMatches = theme === "Todas" || image.theme === theme;
      const searchMatches =
        !term ||
        `${image.title} ${image.theme} ${image.description}`
          .toLocaleLowerCase("pt-BR")
          .includes(term);
      return themeMatches && searchMatches;
    });
  }, [search, theme]);

  const mutation = useMutation({
    mutationFn: (imageId: string) =>
      saveAssignment({ data: { track_slug: trackSlug, image_id: imageId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["track-image-assignments"] });
      await queryClient.invalidateQueries({ queryKey: ["tracks-page-image-assignments"] });
      await queryClient.invalidateQueries({ queryKey: ["track-detail-image-assignments"] });
      toast.success("Capa da trilha atualizada para todos os usuários.");
      setSelectedImageId("");
    },
    onError: (saveError) => toast.error(saveError.message || "Não foi possível salvar a capa."),
  });

  return (
    <section aria-labelledby="track-image-catalog-title" className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ImageIcon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="track-image-catalog-title" className="font-display text-lg font-semibold">
            Catálogo de imagens
          </h2>
          <p className="text-sm text-muted-foreground">
            Escolha uma foto para a capa de cada trilha guiada.
          </p>
        </div>
      </div>

      <Card className="space-y-4 border-sky-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <label className="space-y-1.5 text-sm font-medium">
            <span>Trilha que vai receber a capa</span>
            <select
              value={trackSlug}
              onChange={(event) => {
                setTrackSlug(event.target.value);
                setSelectedImageId("");
              }}
              className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Escolher trilha"
            >
              {READING_TRACKS.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-3 rounded-xl bg-sky-50/80 p-2.5">
            {currentImage ? (
              <img
                src={currentImage.src}
                alt={currentImage.alt}
                className="size-14 rounded-lg object-cover"
              />
            ) : null}
            <div className="min-w-0 pb-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Capa atual
              </p>
              <p className="truncate text-sm font-semibold">
                {currentImage?.title ?? "Imagem padrão"}
              </p>
            </div>
          </div>
        </div>

        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar fotos por tema"
            className="h-11 rounded-xl pl-10"
            aria-label="Buscar fotos no catálogo"
          />
        </label>

        <div
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Filtrar imagens por tema"
        >
          {THEMES.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={theme === item}
              onClick={() => setTheme(item)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${theme === item ? "border-[#244f78] bg-[#244f78] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-sky-300"}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibleImages.map((image) => {
            const isSelected = selectedImageId === image.id;
            const isCurrent = currentImage?.id === image.id;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImageId(image.id)}
                aria-pressed={isSelected}
                className={`group min-w-0 overflow-hidden rounded-2xl border bg-white text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isSelected ? "border-primary ring-2 ring-primary/30" : "border-slate-200"}`}
              >
                <span className="relative block aspect-[4/3] overflow-hidden bg-sky-50">
                  <img
                    src={image.src}
                    alt={image.alt}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  {isSelected || isCurrent ? (
                    <span
                      className={`absolute right-2 top-2 flex size-7 items-center justify-center rounded-full text-white shadow ${isSelected ? "bg-primary" : "bg-emerald-600"}`}
                      aria-label={isSelected ? "Selecionada" : "Capa atual"}
                    >
                      <Check className="size-4" aria-hidden="true" />
                    </span>
                  ) : null}
                </span>
                <span className="block space-y-1 p-2.5">
                  <span className="block truncate text-xs font-semibold text-foreground">
                    {image.title}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">{image.theme}</span>
                </span>
              </button>
            );
          })}
        </div>

        {visibleImages.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            Nenhuma imagem encontrada. Experimente outro termo ou tema.
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            Não foi possível carregar as capas salvas. Verifique se a migração do catálogo já foi
            aplicada.
          </p>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? "Carregando seleção atual…"
              : selectedImageId
                ? `Selecionada: ${TRACK_IMAGE_CATALOG.find((image) => image.id === selectedImageId)?.title}`
                : "Toque em uma foto para selecioná-la."}
          </p>
          <Button
            type="button"
            disabled={!selectedImageId || mutation.isPending || !track}
            onClick={() => mutation.mutate(selectedImageId)}
            className="min-h-10 rounded-xl"
          >
            {mutation.isPending ? "Salvando…" : "Usar como capa"}
          </Button>
        </div>
      </Card>
    </section>
  );
}
