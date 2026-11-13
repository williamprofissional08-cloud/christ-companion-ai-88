import type { Study } from "./studies";

type ManagedStudy = {
  slug: string;
  status: "draft" | "published" | "archived";
  metadata: Record<string, unknown>;
};

/** Regra única para listagem e detalhe; estudos revisados não podem ser arquivados pelo catálogo. */
export function resolveManagedStudy(
  local: Study | undefined,
  managed: ManagedStudy | undefined,
  isCurated: boolean,
): Study | undefined {
  if (!managed || isCurated) return local;
  if (managed.status === "archived") return undefined;
  const metadata = managed.metadata;
  return {
    slug: managed.slug,
    title: String(metadata["title"] ?? local?.title ?? managed.slug),
    category: String(metadata["category"] ?? local?.category ?? "Estudos bíblicos"),
    reference: String(metadata["reference"] ?? local?.reference ?? ""),
    summary: String(metadata["summary"] ?? local?.summary ?? ""),
    depth: metadata["depth"] === "deep" ? "deep" : local?.depth ?? "simple",
  };
}
