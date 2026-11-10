export const COMMUNITY_PDF_MAX_BYTES = 15 * 1024 * 1024;

export type CommunityPdfFile = {
  name: string;
  type: string;
  size: number;
  slice: (start?: number, end?: number) => Blob;
};

export type CommunityPdfValidation =
  | { valid: true }
  | { valid: false; message: string };

/**
 * Checks the PDF extension, declared MIME type, size and file signature.
 * This is a client-side guard against accidental or disguised uploads; the
 * private Storage bucket and its RLS policies remain the authorization boundary.
 */
export async function validateCommunityPdf(
  file: CommunityPdfFile,
): Promise<CommunityPdfValidation> {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return { valid: false, message: "O nome do arquivo precisa terminar em .pdf." };
  }

  if (file.type && file.type.toLowerCase() !== "application/pdf") {
    return { valid: false, message: "O arquivo selecionado não foi identificado como PDF." };
  }

  if (file.size <= 0 || file.size > COMMUNITY_PDF_MAX_BYTES) {
    return { valid: false, message: "O PDF deve ter entre 1 byte e 15 MB." };
  }

  try {
    const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    const header = new TextDecoder().decode(signature);
    if (header !== "%PDF-") {
      return { valid: false, message: "O conteúdo do arquivo não possui uma assinatura PDF válida." };
    }
  } catch {
    return { valid: false, message: "Não foi possível verificar o conteúdo do PDF." };
  }

  return { valid: true };
}
