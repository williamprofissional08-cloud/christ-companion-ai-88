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
import { genesis14Study } from "./genesis-14-study";
import { genesis15Study } from "./genesis-15-study";
import { genesis16Study } from "./genesis-16-study";
import { genesis17Study } from "./genesis-17-study";
import { genesis18Study } from "./genesis-18-study";
import { genesis19Study } from "./genesis-19-study";
import { genesis20Study } from "./genesis-20-study";
import { genesis21Study } from "./genesis-21-study";
import { genesis22Study } from "./genesis-22-study";
import { genesis23Study } from "./genesis-23-study";
import { genesis24Study } from "./genesis-24-study";
import { genesis25Study } from "./genesis-25-study";
import { genesis26Study } from "./genesis-26-study";
import { genesis27Study } from "./genesis-27-study";
import { genesis28Study } from "./genesis-28-study";
import { genesis29Study } from "./genesis-29-study";
import { genesis30Study } from "./genesis-30-study";
import { genesis31Study } from "./genesis-31-study";
import { genesis32Study } from "./genesis-32-study";
import { genesis33Study } from "./genesis-33-study";
import { genesis34Study } from "./genesis-34-study";
import { genesis35Study } from "./genesis-35-study";
import { genesis36Study } from "./genesis-36-study";
import { genesis37Study } from "./genesis-37-study";
import { genesis38Study } from "./genesis-38-study";
import { genesis39Study } from "./genesis-39-study";
import { genesis40Study } from "./genesis-40-study";
import { genesis41Study } from "./genesis-41-study";
import { genesis42Study } from "./genesis-42-study";
import { genesis43Study } from "./genesis-43-study";
import { genesis44Study } from "./genesis-44-study";
import { genesis45Study } from "./genesis-45-study";
import { genesis50Study } from "./genesis-50-study";
import { genesis49Study } from "./genesis-49-study";
import { genesis48Study } from "./genesis-48-study";
import { genesis47Study } from "./genesis-47-study";
import { genesis46Study } from "./genesis-46-study";
import { genesis1Study } from "./genesis-1-study";
import { exodus1Study } from "./exodus-1-study";
import { exodus2Study } from "./exodus-2-study";
import { exodus3Study } from "./exodus-3-study";
import { exodus4Study } from "./exodus-4-study";
import { exodus5Study } from "./exodus-5-study";
import { exodus6Study } from "./exodus-6-study";
import { exodus7Study } from "./exodus-7-study";
import { exodus8Study } from "./exodus-8-study";
import { exodus9Study } from "./exodus-9-study";
import { exodus10Study } from "./exodus-10-study";
import { exodus11Study } from "./exodus-11-study";
import { exodus12Study } from "./exodus-12-study";
import { exodus13Study } from "./exodus-13-study";
import { exodus14Study } from "./exodus-14-study";
import { exodus15Study } from "./exodus-15-study";
import { exodus16Study } from "./exodus-16-study";
import { exodus17Study } from "./exodus-17-study";
import { exodus18Study } from "./exodus-18-study";
import { exodus19Study } from "./exodus-19-study";
import { exodus20Study } from "./exodus-20-study";
import { exodus21Study } from "./exodus-21-study";

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
  "biblia-genesis-cap-14": genesis14Study,
  "biblia-genesis-cap-15": genesis15Study,
  "biblia-genesis-cap-16": genesis16Study,
  "biblia-genesis-cap-17": genesis17Study,
  "biblia-genesis-cap-18": genesis18Study,
  "biblia-genesis-cap-19": genesis19Study,
  "biblia-genesis-cap-20": genesis20Study,
  "biblia-genesis-cap-21": genesis21Study,
  "biblia-genesis-cap-22": genesis22Study,
  "biblia-genesis-cap-23": genesis23Study,
  "biblia-genesis-cap-24": genesis24Study,
  "biblia-genesis-cap-25": genesis25Study,
  "biblia-genesis-cap-26": genesis26Study,
  "biblia-genesis-cap-27": genesis27Study,
  "biblia-genesis-cap-28": genesis28Study,
  "biblia-genesis-cap-29": genesis29Study,
  "biblia-genesis-cap-30": genesis30Study,
  "biblia-genesis-cap-31": genesis31Study,
  "biblia-genesis-cap-32": genesis32Study,
  "biblia-genesis-cap-33": genesis33Study,
  "biblia-genesis-cap-34": genesis34Study,
  "biblia-genesis-cap-35": genesis35Study,
  "biblia-genesis-cap-36": genesis36Study,
  "biblia-genesis-cap-37": genesis37Study,
  "biblia-genesis-cap-38": genesis38Study,
  "biblia-genesis-cap-39": genesis39Study,
  "biblia-genesis-cap-40": genesis40Study,
  "biblia-genesis-cap-41": genesis41Study,
  "biblia-genesis-cap-42": genesis42Study,
  "biblia-genesis-cap-43": genesis43Study,
  "biblia-genesis-cap-44": genesis44Study,
  "biblia-genesis-cap-45": genesis45Study,
  "biblia-genesis-cap-50": genesis50Study,
  "biblia-genesis-cap-49": genesis49Study,
  "biblia-genesis-cap-48": genesis48Study,
  "biblia-genesis-cap-47": genesis47Study,
  "biblia-genesis-cap-46": genesis46Study,
  "biblia-exodo-cap-1": exodus1Study,
  "biblia-exodo-cap-2": exodus2Study,
  "biblia-exodo-cap-3": exodus3Study,
  "biblia-exodo-cap-4": exodus4Study,
  "biblia-exodo-cap-5": exodus5Study,
  "biblia-exodo-cap-6": exodus6Study,
  "biblia-exodo-cap-7": exodus7Study,
  "biblia-exodo-cap-8": exodus8Study,
  "biblia-exodo-cap-9": exodus9Study,
  "biblia-exodo-cap-10": exodus10Study,
  "biblia-exodo-cap-11": exodus11Study,
  "biblia-exodo-cap-12": exodus12Study,
  "biblia-exodo-cap-13": exodus13Study,
  "biblia-exodo-cap-14": exodus14Study,
  "biblia-exodo-cap-15": exodus15Study,
  "biblia-exodo-cap-16": exodus16Study,
  "biblia-exodo-cap-17": exodus17Study,
  "biblia-exodo-cap-18": exodus18Study,
  "biblia-exodo-cap-19": exodus19Study,
  "biblia-exodo-cap-20": exodus20Study,
  "biblia-exodo-cap-21": exodus21Study,
};
