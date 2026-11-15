/**
 * Community photo posts use the EXISTING public community-images bucket and
 * community_posts.image_url column; this avoids requiring a new migration.
 * Media in this bucket is publicly accessible: use only for public posts.
 */
export const COMMUNITY_POST_IMAGE_BUCKET = "community-images";
export const COMMUNITY_POST_IMAGE_MAX_BYTES = 8_000_000;

const supported = new Set([
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif",
]);

export function isCommunityPhoto(file: { type: string; name: string }): boolean {
  const type = file.type.toLowerCase();
  if (supported.has(type)) return true;
  if (type !== "") return false;
  return /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
}

function blobFromCanvas(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error("Não foi possível converter esta foto."));
      else resolve(blob);
    }, "image/jpeg", quality);
  });
}

/**
 * Compresses large iPhone photos safely before the 8 MB bucket upload.
 * iOS HEIC is converted to JPEG when supported by the active browser;
 * unsupported files yield a direct format error rather than a generic
 * Supabase storage error. Existing small JPG/PNG/WebP files are unchanged.
 */
export async function prepareCommunityPhoto(file: File): Promise<File> {
  if (!isCommunityPhoto(file)) {
    throw new Error("Escolha uma foto JPG, PNG, WebP ou HEIC do seu aparelho.");
  }
  if (file.size <= 0) throw new Error("A foto escolhida está vazia.");
  if (file.size > 40_000_000) {
    throw new Error("A foto ultrapassa 40 MB. Escolha uma imagem menor.");
  }
  const heic = /heic|heif/i.test(file.type + " " + file.name);
  if (!heic && file.size <= 6_000_000 && supported.has(file.type)) return file;

  const photoUrl = URL.createObjectURL(file);
  const img = document.createElement("img");
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("O navegador não conseguiu abrir esta foto. Se for HEIC, converta-a para JPG no iPhone e tente novamente."));
      img.src = photoUrl;
    });
    const maxSide = 1920;
    const ratio = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    if (!Number.isFinite(ratio) || ratio <= 0) throw new Error("Não foi possível ler as dimensões da foto.");
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar esta foto para envio.");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    let processed: Blob | null = null;
    for (const quality of [0.82, 0.64, 0.46]) {
      processed = await blobFromCanvas(canvas, quality);
      if (processed.size <= COMMUNITY_POST_IMAGE_MAX_BYTES) break;
    }
    if (!processed || processed.size > COMMUNITY_POST_IMAGE_MAX_BYTES) {
      throw new Error("Esta foto ficou grande demais mesmo após a compressão. Escolha uma foto menor.");
    }
    return new File([processed], "foto-caminho-divino.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(photoUrl);
  }
}

export function isMissingCommunityStoryBackend(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { code?: unknown; message?: unknown };
  return value.code === "PGRST205" || value.code === "42P01" ||
    (typeof value.message === "string" && /schema cache|relation .* does not exist/i.test(value.message));
}
