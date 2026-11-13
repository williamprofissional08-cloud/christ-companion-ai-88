import type { DevotionalContent } from "@/lib/types";
import { fallbackDevotional } from "@/lib/content/fallback-devotional";

const DEVOTIONAL_REQUEST_TIMEOUT_MS = 12_000;

function isCompleteDevotional(value: unknown): value is DevotionalContent {
  if (!value || typeof value !== "object") return false;
  const content = value as Partial<DevotionalContent>;
  return Boolean(
    typeof content.theme === "string" && content.theme.trim() &&
    content.verse && typeof content.verse.reference === "string" && content.verse.reference.trim() &&
    typeof content.verse.text === "string" && content.verse.text.trim() &&
    typeof content.context === "string" && content.context.trim() &&
    typeof content.biblicalMeaning === "string" && content.biblicalMeaning.trim() &&
    typeof content.reflection === "string" && content.reflection.trim() &&
    typeof content.application === "string" && content.application.trim() &&
    typeof content.prayer === "string" && content.prayer.trim() &&
    typeof content.challenge === "string" && content.challenge.trim() &&
    typeof content.question === "string" && content.question.trim() &&
    typeof content.motivational === "string" && content.motivational.trim() &&
    typeof content.readingSuggestion === "string" && content.readingSuggestion.trim()
  );
}

/**
 * The devotional must remain readable even when the server function cannot
 * authenticate, the AI provider is unavailable, or the request stalls.
 * The fallback is resolved in the browser, outside the server middleware.
 */
export async function loadDevotionalSafely(
  day: string,
  request: () => Promise<DevotionalContent>,
): Promise<DevotionalContent> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      request(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("A solicitação do devocional excedeu o tempo limite.")),
          DEVOTIONAL_REQUEST_TIMEOUT_MS,
        );
      }),
    ]);
    if (!isCompleteDevotional(result)) {
      throw new Error("O conteúdo retornado para o devocional está incompleto.");
    }
    return result;
  } catch (error) {
    console.warn("[devotional] Server request failed; displaying local devotional fallback.", error);
    return fallbackDevotional(day);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
