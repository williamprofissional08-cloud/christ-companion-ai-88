import type { DevotionalContent } from "@/lib/types";
import { getDailyDevotional } from "@/lib/content/daily-devotional";

/**
 * O devocional publicado é autoral, completo e compartilhado entre usuários.
 * Ele é resolvido localmente pela data de Brasília: não depende do provedor
 * de IA, da autenticação ou de algum registro salvo anteriormente no banco.
 */
export function loadDevotionalSafely(day: string): Promise<DevotionalContent> {
  return Promise.resolve(getDailyDevotional(day));
}
