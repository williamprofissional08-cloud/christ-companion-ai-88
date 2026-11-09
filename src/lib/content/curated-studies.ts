import type { StudyContent } from "../types";
import { genesis2Study } from "./genesis-2-study";
import { genesis3Study } from "./genesis-3-study";
import { genesis4Study } from "./genesis-4-study";
import { genesis5Study } from "./genesis-5-study";
import { genesis6Study } from "./genesis-6-study";
import { genesis7Study } from "./genesis-7-study";
import { genesis8Study } from "./genesis-8-study";
import { genesis9Study } from "./genesis-9-study";
import { genesis10Study } from "./genesis-10-study";
import { genesis11Study } from "./genesis-11-study";
import { genesis12Study } from "./genesis-12-study";
import { genesis13Study } from "./genesis-13-study";
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
  "biblia-genesis-cap-7": genesis7Study,
  "biblia-genesis-cap-8": genesis8Study,
  "biblia-genesis-cap-9": genesis9Study,
  "biblia-genesis-cap-10": genesis10Study,
  "biblia-genesis-cap-11": genesis11Study,
  "biblia-genesis-cap-12": genesis12Study,
  "biblia-genesis-cap-13": genesis13Study,
};
