/**
 * TTS do Professor IA (Dia 8) — utilidades puras e client-safe.
 * Nenhum segredo aqui: a chave do provedor fica somente no servidor.
 */

/** Margem de segurança sobre o limite técnico (~10.000 caracteres). */
export const TTS_MAX_CHARS = 3500;

const BOOK_SPEECH: Record<string, string> = {
  "1": "primeira",
  "2": "segunda",
  "3": "terceira",
};

/** Converte "2 Timóteo 3:16-17" em algo natural para fala. */
function refToSpeech(match: string): string {
  const m = match.match(/^([123])?\s*([\p{L}][\p{L}.\s]*?)\s+(\d+):(\d+)(?:-(\d+))?$/u);
  if (!m) return match;
  const [, ordinal, book, chapter, verseStart, verseEnd] = m;
  const prefix = ordinal ? `${BOOK_SPEECH[ordinal]} ` : "";
  const verses = verseEnd ? `versículos ${verseStart} a ${verseEnd}` : `versículo ${verseStart}`;
  return `${prefix}${book!.trim()}, capítulo ${chapter}, ${verses}`;
}

/**
 * Prepara o texto da resposta para leitura em voz alta.
 * Remove marcações de markdown e adapta referências bíblicas.
 * Não altera o texto exibido ao usuário.
 */
export function buildSpeechText(answer: string): string {
  const clean = answer
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return clean.replace(
    /\b([123]\s+)?([\p{Lu}][\p{L}.]*(?:\s+[\p{L}.]+)?)\s+(\d+):(\d+)(?:-(\d+))?\b/gu,
    (match) => refToSpeech(match),
  );
}

type NarrationBlock = { title: string | null; body: string; kind: string };

/**
 * Monta o roteiro a partir dos blocos publicados da própria aula.
 * Respostas e anotações privadas vivem no Caderno do pregador e nunca entram aqui.
 */
export function buildLessonNarrationText(title: string, blocks: NarrationBlock[]): string {
  const narration = blocks
    .filter((block) => {
      const heading = (block.title ?? "").toLocaleLowerCase("pt-BR");
      return (
        block.body.trim() && block.kind !== "exercicio" && !heading.includes("meditação do aluno")
      );
    })
    .map((block) => {
      const heading = block.title?.trim();
      const body = buildSpeechText(block.body);
      return heading ? `${heading}. ${body}` : body;
    })
    .filter(Boolean);

  return buildSpeechText([`Aula: ${title}.`, ...narration].join("\n\n"));
}

/** Divide o texto em partes seguras, sem cortar palavras nem duplicar conteúdo. */
export function chunkSpeechText(text: string, max = TTS_MAX_CHARS): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= max) return [trimmed];

  const pieces = trimmed.match(/[^.!?\n]+[.!?\n]*\s*/g) ?? [trimmed];
  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };

  for (const piece of pieces) {
    if (piece.length > max) {
      flush();
      const words = piece.split(/\s+/);
      let buffer = "";
      for (const word of words) {
        if ((buffer + " " + word).trim().length > max) {
          if (buffer.trim()) chunks.push(buffer.trim());
          buffer = word;
        } else {
          buffer = buffer ? `${buffer} ${word}` : word;
        }
      }
      if (buffer.trim()) chunks.push(buffer.trim());
      continue;
    }
    if (current.length + piece.length > max) flush();
    current += piece;
  }
  flush();
  return chunks;
}

export const TTS_LABELS = {
  idle: "Ouvir resposta",
  loading: "Preparando áudio...",
  playing: "Pausar",
  paused: "Continuar",
  stop: "Parar",
  error: "Não foi possível gerar o áudio. Tente novamente.",
} as const;
