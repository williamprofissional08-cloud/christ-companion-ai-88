import type { DevotionalContent } from "@/lib/types";
import { curatedDevotionalsA } from "./curated-devotionals-a";
import { curatedDevotionalsB } from "./curated-devotionals-b";

/**
 * Devocionais autorais completos, preparados para o Caminho Divino.
 * Os PDFs de referência não são distribuídos nem copiados no aplicativo.
 */
export const CURATED_DEVOTIONALS: DevotionalContent[] = [
  ...curatedDevotionalsA,
  ...curatedDevotionalsB,
];

/** Uma única leitura para todos os usuários, fixa durante o dia de Brasília. */
export function curatedDevotionalCount(): number {
  return CURATED_DEVOTIONALS.length;
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Embaralhamento determinístico por ciclo.
 * Mantém variedade, não repete durante o ciclo completo e não depende de
 * Math.random, navegador, usuário, cache, banco ou chamadas de IA.
 */
function shuffledIndices(cycle: number): number[] {
  const size = CURATED_DEVOTIONALS.length;
  const indices = Array.from({ length: size }, (_, index) => index);
  let seed = hashSeed(`caminho-divino:devocionais:v1:${cycle}`);
  for (let i = size - 1; i > 0; i -= 1) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    const j = (seed >>> 0) % (i + 1);
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }
  return indices;
}

export function getDailyDevotional(day: string): DevotionalContent {
  const size = CURATED_DEVOTIONALS.length;
  if (!size) throw new Error("Acervo de devocionais vazio.");

  const validDay = /^\d{4}-\d{2}-\d{2}$/.test(day);
  const parsed = validDay ? Date.parse(`${day}T00:00:00Z`) : NaN;
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 10) !== day) {
    throw new Error("Data inválida para seleção do devocional.");
  }

  const epochDay = Math.floor(parsed / 86_400_000);
  const cycle = Math.floor(epochDay / size);
  const position = ((epochDay % size) + size) % size;
  const indices = shuffledIndices(cycle);

  // Evita que o último devocional de um ciclo se repita no primeiro do próximo.
  if (position === 0) {
    const previous = shuffledIndices(cycle - 1);
    if (indices[0] === previous[size - 1] && size > 1) {
      [indices[0], indices[1]] = [indices[1]!, indices[0]!];
    }
  } else if (size > 1 && indices[0] === shuffledIndices(cycle - 1)[size - 1]) {
    // A mesma correção deve valer para todo o ciclo, não só no primeiro dia.
    [indices[0], indices[1]] = [indices[1]!, indices[0]!];
  }

  return CURATED_DEVOTIONALS[indices[position]!]!;
}
