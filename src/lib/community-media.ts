export const COMMUNITY_MEDIA_BUCKET = "community-media";
export const COMMUNITY_MEDIA_MAX_BYTES = 49_000_000;
export const COMMUNITY_MAX_VIDEO_SECONDS = 60;

export type CommunityMediaKind = "image" | "video";
export type ValidatedMedia = { kind: CommunityMediaKind; seconds: number | null; extension: string };

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
};
const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
};

/**
 * Client-side early validation for helpful UX. The database enforces the declared
 * maximum duration as well; a production media processing service must inspect
 * the bytes before approving untrusted uploads.
 */
export async function validateCommunityMedia(file: File): Promise<ValidatedMedia> {
  if (file.size === 0 || file.size > COMMUNITY_MEDIA_MAX_BYTES) {
    throw new Error("Escolha um arquivo de até 49 MB. O plano gratuito limita os envios.");
  }
  const imageExt = IMAGE_TYPES[file.type];
  if (imageExt) return { kind: "image", seconds: null, extension: imageExt };
  const videoExt = VIDEO_TYPES[file.type];
  if (!videoExt) throw new Error("Use foto JPG/PNG/WebP ou vídeo MP4/WebM/MOV.");

  const url = URL.createObjectURL(file);
  const media = document.createElement("video");
  media.preload = "metadata";
  media.muted = true;
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error("Não foi possível ler a duração deste vídeo.")), 12_000);
      media.onloadedmetadata = () => { window.clearTimeout(timer); resolve(media.duration); };
      media.onerror = () => { window.clearTimeout(timer); reject(new Error("Vídeo inválido ou formato indisponível neste navegador.")); };
      media.src = url;
    });
    if (!Number.isFinite(duration) || duration <= 0 || duration > COMMUNITY_MAX_VIDEO_SECONDS) {
      throw new Error("O vídeo deve ter no máximo 1 minuto (60 segundos).");
    }
    return { kind: "video", seconds: Math.ceil(duration), extension: videoExt };
  } finally {
    media.removeAttribute("src");
    media.load();
    URL.revokeObjectURL(url);
  }
}
