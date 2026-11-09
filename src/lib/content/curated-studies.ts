import type { StudyContent } from "../types";
import { genesis2Study } from "./genesis-2-study";
import { genesis3Study } from "./genesis-3-study";
import { genesis4Study } from "./genesis-4-study";
import { genesis5Study } from "./genesis-5-study";
import { genesis6Study } from "./genesis-6-study";
import { genesis8Study } from "./genesis-8-study";
import { genesis1Study } from "./genesis-1-study";

/**
 * Estudos revisados manualmente. Têm prioridade sobre o conteúdo gerado por IA,
 * para servir de padrão de referência antes da expansão do curso completo.
 * Rótulos: [TEXTO BÍBLICO] [CONTEXTO] [INFERÊNCIA] [INTERPRETAÇÃO] [ESPECULAÇÃO].
 */
export const CURATED_STUDIES: Record<string, StudyContent> = {
  "genesis-1-criacao": genesis1Study,
  "biblia-genesis-cap-2": genesis2Study,
  "biblia-genesis-cap-3": genesis3Study,
  "biblia-genesis-cap-4": genesis4Study,
  "biblia-genesis-cap-5": genesis5Study,
  "biblia-genesis-cap-6": genesis6Study,
  "biblia-genesis-cap-8": genesis8Study,
};
