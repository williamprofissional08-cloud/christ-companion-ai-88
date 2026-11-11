import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const curatedBatch = [
  { book: "Esdras", chapter: 7, verseCount: 28, slug: "biblia-esdras-cap-7", exportName: "ezra7Study", file: "ezra-7-study.ts" },
  { book: "Esdras", chapter: 8, verseCount: 36, slug: "biblia-esdras-cap-8", exportName: "ezra8Study", file: "ezra-8-study.ts" },
  { book: "Esdras", chapter: 9, verseCount: 15, slug: "biblia-esdras-cap-9", exportName: "ezra9Study", file: "ezra-9-study.ts" },
  { book: "Esdras", chapter: 10, verseCount: 44, slug: "biblia-esdras-cap-10", exportName: "ezra10Study", file: "ezra-10-study.ts" },
  { book: "Esdras", chapter: 1, verseCount: 11, slug: "biblia-esdras-cap-1", exportName: "ezra1Study", file: "ezra-1-study.ts" },
  { book: "Esdras", chapter: 2, verseCount: 70, slug: "biblia-esdras-cap-2", exportName: "ezra2Study", file: "ezra-2-study.ts" },
  { book: "Esdras", chapter: 3, verseCount: 13, slug: "biblia-esdras-cap-3", exportName: "ezra3Study", file: "ezra-3-study.ts" },
  { book: "Esdras", chapter: 4, verseCount: 24, slug: "biblia-esdras-cap-4", exportName: "ezra4Study", file: "ezra-4-study.ts" },
  { book: "Esdras", chapter: 5, verseCount: 17, slug: "biblia-esdras-cap-5", exportName: "ezra5Study", file: "ezra-5-study.ts" },
  { book: "Esdras", chapter: 6, verseCount: 22, slug: "biblia-esdras-cap-6", exportName: "ezra6Study", file: "ezra-6-study.ts" },
  { book: "Rute", chapter: 1, verseCount: 22, slug: "biblia-rute-cap-1", exportName: "ruth1Study", file: "ruth-1-study.ts" },
  { book: "Rute", chapter: 2, verseCount: 23, slug: "biblia-rute-cap-2", exportName: "ruth2Study", file: "ruth-2-study.ts" },
  { book: "Rute", chapter: 3, verseCount: 18, slug: "biblia-rute-cap-3", exportName: "ruth3Study", file: "ruth-3-study.ts" },
  { book: "Rute", chapter: 4, verseCount: 22, slug: "biblia-rute-cap-4", exportName: "ruth4Study", file: "ruth-4-study.ts" },
  { book: "Gênesis", chapter: 45, verseCount: 28, slug: "biblia-genesis-cap-45", exportName: "genesis45Study", file: "genesis-45-study.ts" },
  { book: "Gênesis", chapter: 46, verseCount: 34, slug: "biblia-genesis-cap-46", exportName: "genesis46Study", file: "genesis-46-study.ts" },
  { book: "Gênesis", chapter: 47, verseCount: 31, slug: "biblia-genesis-cap-47", exportName: "genesis47Study", file: "genesis-47-study.ts" },
  { book: "Gênesis", chapter: 48, verseCount: 22, slug: "biblia-genesis-cap-48", exportName: "genesis48Study", file: "genesis-48-study.ts" },
  { book: "Gênesis", chapter: 49, verseCount: 33, slug: "biblia-genesis-cap-49", exportName: "genesis49Study", file: "genesis-49-study.ts" },
  { book: "Gênesis", chapter: 50, verseCount: 26, slug: "biblia-genesis-cap-50", exportName: "genesis50Study", file: "genesis-50-study.ts" },
  { book: "Êxodo", chapter: 1, verseCount: 22, slug: "biblia-exodo-cap-1", exportName: "exodus1Study", file: "exodus-1-study.ts" },
  { book: "Números", chapter: 31, verseCount: 54, slug: "biblia-numeros-cap-31", exportName: "Numbers31Study", file: "numbers-31-study.ts" },
  { book: "Números", chapter: 32, verseCount: 42, slug: "biblia-numeros-cap-32", exportName: "Numbers32Study", file: "numbers-32-study.ts" },
  { book: "Números", chapter: 33, verseCount: 56, slug: "biblia-numeros-cap-33", exportName: "Numbers33Study", file: "numbers-33-study.ts" },
  { book: "Números", chapter: 34, verseCount: 29, slug: "biblia-numeros-cap-34", exportName: "Numbers34Study", file: "numbers-34-study.ts" },
  { book: "Números", chapter: 35, verseCount: 34, slug: "biblia-numeros-cap-35", exportName: "Numbers35Study", file: "numbers-35-study.ts" },
  { book: "Números", chapter: 36, verseCount: 13, slug: "biblia-numeros-cap-36", exportName: "Numbers36Study", file: "numbers-36-study.ts" },
  { book: "Deuteronômio", chapter: 1, verseCount: 46, slug: "biblia-deuteronomio-cap-1", exportName: "deuteronomy1Study", file: "deuteronomy-1-study.ts" },
  { book: "Deuteronômio", chapter: 2, verseCount: 37, slug: "biblia-deuteronomio-cap-2", exportName: "deuteronomy2Study", file: "deuteronomy-2-study.ts" },
  { book: "Deuteronômio", chapter: 3, verseCount: 29, slug: "biblia-deuteronomio-cap-3", exportName: "deuteronomy3Study", file: "deuteronomy-3-study.ts" },
  { book: "Deuteronômio", chapter: 4, verseCount: 49, slug: "biblia-deuteronomio-cap-4", exportName: "deuteronomy4Study", file: "deuteronomy-4-study.ts" },
  { book: "Deuteronômio", chapter: 5, verseCount: 33, slug: "biblia-deuteronomio-cap-5", exportName: "deuteronomy5Study", file: "deuteronomy-5-study.ts" },
  { book: "Deuteronômio", chapter: 6, verseCount: 25, slug: "biblia-deuteronomio-cap-6", exportName: "deuteronomy6Study", file: "deuteronomy-6-study.ts" },
  { book: "Deuteronômio", chapter: 7, verseCount: 26, slug: "biblia-deuteronomio-cap-7", exportName: "deuteronomy7Study", file: "deuteronomy-7-study.ts" },
  { book: "Deuteronômio", chapter: 8, verseCount: 20, slug: "biblia-deuteronomio-cap-8", exportName: "deuteronomy8Study", file: "deuteronomy-8-study.ts" },
  { book: "Deuteronômio", chapter: 9, verseCount: 29, slug: "biblia-deuteronomio-cap-9", exportName: "deuteronomy9Study", file: "deuteronomy-9-study.ts" },
  { book: "Deuteronômio", chapter: 10, verseCount: 22, slug: "biblia-deuteronomio-cap-10", exportName: "deuteronomy10Study", file: "deuteronomy-10-study.ts" },
  { book: "Deuteronômio", chapter: 11, verseCount: 32, slug: "biblia-deuteronomio-cap-11", exportName: "deuteronomy11Study", file: "deuteronomy-11-study.ts" },
  { book: "Deuteronômio", chapter: 12, verseCount: 32, slug: "biblia-deuteronomio-cap-12", exportName: "deuteronomy12Study", file: "deuteronomy-12-study.ts" },
  { book: "Deuteronômio", chapter: 13, verseCount: 18, slug: "biblia-deuteronomio-cap-13", exportName: "deuteronomy13Study", file: "deuteronomy-13-study.ts" },
  { book: "Deuteronômio", chapter: 14, verseCount: 29, slug: "biblia-deuteronomio-cap-14", exportName: "deuteronomy14Study", file: "deuteronomy-14-study.ts" },
  { book: "Deuteronômio", chapter: 15, verseCount: 23, slug: "biblia-deuteronomio-cap-15", exportName: "deuteronomy15Study", file: "deuteronomy-15-study.ts" },
  { book: "Deuteronômio", chapter: 16, verseCount: 22, slug: "biblia-deuteronomio-cap-16", exportName: "deuteronomy16Study", file: "deuteronomy-16-study.ts" },
  { book: "Deuteronômio", chapter: 17, verseCount: 20, slug: "biblia-deuteronomio-cap-17", exportName: "deuteronomy17Study", file: "deuteronomy-17-study.ts" },
  { book: "Deuteronômio", chapter: 18, verseCount: 22, slug: "biblia-deuteronomio-cap-18", exportName: "deuteronomy18Study", file: "deuteronomy-18-study.ts" },
  { book: "Deuteronômio", chapter: 19, verseCount: 21, slug: "biblia-deuteronomio-cap-19", exportName: "deuteronomy19Study", file: "deuteronomy-19-study.ts" },
  { book: "Deuteronômio", chapter: 20, verseCount: 20, slug: "biblia-deuteronomio-cap-20", exportName: "deuteronomy20Study", file: "deuteronomy-20-study.ts" },
  { book: "Deuteronômio", chapter: 21, verseCount: 23, slug: "biblia-deuteronomio-cap-21", exportName: "deuteronomy21Study", file: "deuteronomy-21-study.ts" },
  { book: "Deuteronômio", chapter: 22, verseCount: 30, slug: "biblia-deuteronomio-cap-22", exportName: "deuteronomy22Study", file: "deuteronomy-22-study.ts" },
  { book: "Deuteronômio", chapter: 23, verseCount: 25, slug: "biblia-deuteronomio-cap-23", exportName: "deuteronomy23Study", file: "deuteronomy-23-study.ts" },
  { book: "Deuteronômio", chapter: 24, verseCount: 22, slug: "biblia-deuteronomio-cap-24", exportName: "deuteronomy24Study", file: "deuteronomy-24-study.ts" },
  { book: "Deuteronômio", chapter: 25, verseCount: 19, slug: "biblia-deuteronomio-cap-25", exportName: "deuteronomy25Study", file: "deuteronomy-25-study.ts" },
  { book: "Deuteronômio", chapter: 26, verseCount: 19, slug: "biblia-deuteronomio-cap-26", exportName: "deuteronomy26Study", file: "deuteronomy-26-study.ts" },
  { book: "Deuteronômio", chapter: 27, verseCount: 26, slug: "biblia-deuteronomio-cap-27", exportName: "deuteronomy27Study", file: "deuteronomy-27-study.ts" },
  { book: "Deuteronômio", chapter: 28, verseCount: 68, slug: "biblia-deuteronomio-cap-28", exportName: "deuteronomy28Study", file: "deuteronomy-28-study.ts" },
  { book: "Deuteronômio", chapter: 29, verseCount: 29, slug: "biblia-deuteronomio-cap-29", exportName: "deuteronomy29Study", file: "deuteronomy-29-study.ts" },
  { book: "Deuteronômio", chapter: 30, verseCount: 20, slug: "biblia-deuteronomio-cap-30", exportName: "deuteronomy30Study", file: "deuteronomy-30-study.ts" },
  { book: "Deuteronômio", chapter: 31, verseCount: 30, slug: "biblia-deuteronomio-cap-31", exportName: "deuteronomy31Study", file: "deuteronomy-31-study.ts" },
  { book: "Deuteronômio", chapter: 32, verseCount: 52, slug: "biblia-deuteronomio-cap-32", exportName: "deuteronomy32Study", file: "deuteronomy-32-study.ts" },
  { book: "Deuteronômio", chapter: 33, verseCount: 29, slug: "biblia-deuteronomio-cap-33", exportName: "deuteronomy33Study", file: "deuteronomy-33-study.ts" },
  { book: "Deuteronômio", chapter: 34, verseCount: 12, slug: "biblia-deuteronomio-cap-34", exportName: "deuteronomy34Study", file: "deuteronomy-34-study.ts" },
  { book: "Josué", chapter: 1, verseCount: 18, slug: "biblia-josue-cap-1", exportName: "joshua1Study", file: "joshua-1-study.ts" },
  { book: "Josué", chapter: 2, verseCount: 24, slug: "biblia-josue-cap-2", exportName: "joshua2Study", file: "joshua-2-study.ts" },
  { book: "Josué", chapter: 3, verseCount: 17, slug: "biblia-josue-cap-3", exportName: "joshua3Study", file: "joshua-3-study.ts" },
  { book: "Josué", chapter: 4, verseCount: 24, slug: "biblia-josue-cap-4", exportName: "joshua4Study", file: "joshua-4-study.ts" },
  { book: "Josué", chapter: 5, verseCount: 15, slug: "biblia-josue-cap-5", exportName: "joshua5Study", file: "joshua-5-study.ts" },
  { book: "Josué", chapter: 6, verseCount: 27, slug: "biblia-josue-cap-6", exportName: "joshua6Study", file: "joshua-6-study.ts" },
  { book: "Josué", chapter: 7, verseCount: 26, slug: "biblia-josue-cap-7", exportName: "joshua7Study", file: "joshua-7-study.ts" },
  { book: "Josué", chapter: 8, verseCount: 35, slug: "biblia-josue-cap-8", exportName: "joshua8Study", file: "joshua-8-study.ts" },
  { book: "Josué", chapter: 9, verseCount: 27, slug: "biblia-josue-cap-9", exportName: "joshua9Study", file: "joshua-9-study.ts" },
  { book: "Josué", chapter: 10, verseCount: 43, slug: "biblia-josue-cap-10", exportName: "joshua10Study", file: "joshua-10-study.ts" },
  { book: "Josué", chapter: 11, verseCount: 23, slug: "biblia-josue-cap-11", exportName: "joshua11Study", file: "joshua-11-study.ts" },
  { book: "Josué", chapter: 12, verseCount: 24, slug: "biblia-josue-cap-12", exportName: "joshua12Study", file: "joshua-12-study.ts" },
  { book: "Josué", chapter: 13, verseCount: 33, slug: "biblia-josue-cap-13", exportName: "joshua13Study", file: "joshua-13-study.ts" },
  { book: "Josué", chapter: 14, verseCount: 15, slug: "biblia-josue-cap-14", exportName: "joshua14Study", file: "joshua-14-study.ts" },
  { book: "Josué", chapter: 15, verseCount: 63, slug: "biblia-josue-cap-15", exportName: "joshua15Study", file: "joshua-15-study.ts" },
  { book: "Josué", chapter: 16, verseCount: 10, slug: "biblia-josue-cap-16", exportName: "joshua16Study", file: "joshua-16-study.ts" },
  { book: "Josué", chapter: 17, verseCount: 18, slug: "biblia-josue-cap-17", exportName: "joshua17Study", file: "joshua-17-study.ts" },
  { book: "Josué", chapter: 18, verseCount: 28, slug: "biblia-josue-cap-18", exportName: "joshua18Study", file: "joshua-18-study.ts" },
  { book: "Josué", chapter: 19, verseCount: 51, slug: "biblia-josue-cap-19", exportName: "joshua19Study", file: "joshua-19-study.ts" },
  { book: "Josué", chapter: 20, verseCount: 9, slug: "biblia-josue-cap-20", exportName: "joshua20Study", file: "joshua-20-study.ts" },
  { book: "Josué", chapter: 21, verseCount: 45, slug: "biblia-josue-cap-21", exportName: "joshua21Study", file: "joshua-21-study.ts" },
  { book: "Josué", chapter: 22, verseCount: 34, slug: "biblia-josue-cap-22", exportName: "joshua22Study", file: "joshua-22-study.ts" },
  { book: "Josué", chapter: 23, verseCount: 16, slug: "biblia-josue-cap-23", exportName: "joshua23Study", file: "joshua-23-study.ts" },
  { book: "Josué", chapter: 24, verseCount: 33, slug: "biblia-josue-cap-24", exportName: "joshua24Study", file: "joshua-24-study.ts" },
  { book: "Juízes", chapter: 1, verseCount: 36, slug: "biblia-juizes-cap-1", exportName: "judges1Study", file: "judges-1-study.ts" },
  { book: "Juízes", chapter: 2, verseCount: 23, slug: "biblia-juizes-cap-2", exportName: "judges2Study", file: "judges-2-study.ts" },
  { book: "Juízes", chapter: 3, verseCount: 31, slug: "biblia-juizes-cap-3", exportName: "judges3Study", file: "judges-3-study.ts" },
  { book: "Juízes", chapter: 4, verseCount: 24, slug: "biblia-juizes-cap-4", exportName: "judges4Study", file: "judges-4-study.ts" },
  { book: "Juízes", chapter: 5, verseCount: 31, slug: "biblia-juizes-cap-5", exportName: "judges5Study", file: "judges-5-study.ts" },
  { book: "Juízes", chapter: 6, verseCount: 40, slug: "biblia-juizes-cap-6", exportName: "judges6Study", file: "judges-6-study.ts" },
  { book: "Juízes", chapter: 7, verseCount: 25, slug: "biblia-juizes-cap-7", exportName: "judges7Study", file: "judges-7-study.ts" },
  { book: "Juízes", chapter: 8, verseCount: 35, slug: "biblia-juizes-cap-8", exportName: "judges8Study", file: "judges-8-study.ts" },
  { book: "Juízes", chapter: 9, verseCount: 57, slug: "biblia-juizes-cap-9", exportName: "judges9Study", file: "judges-9-study.ts" },
  { book: "Juízes", chapter: 10, verseCount: 18, slug: "biblia-juizes-cap-10", exportName: "judges10Study", file: "judges-10-study.ts" },
  { book: "Juízes", chapter: 11, verseCount: 40, slug: "biblia-juizes-cap-11", exportName: "judges11Study", file: "judges-11-study.ts" },
  { book: "Juízes", chapter: 12, verseCount: 15, slug: "biblia-juizes-cap-12", exportName: "judges12Study", file: "judges-12-study.ts" },
  { book: "Juízes", chapter: 13, verseCount: 25, slug: "biblia-juizes-cap-13", exportName: "judges13Study", file: "judges-13-study.ts" },
  { book: "Juízes", chapter: 14, verseCount: 20, slug: "biblia-juizes-cap-14", exportName: "judges14Study", file: "judges-14-study.ts" },
  { book: "Juízes", chapter: 15, verseCount: 20, slug: "biblia-juizes-cap-15", exportName: "judges15Study", file: "judges-15-study.ts" },
  { book: "Juízes", chapter: 16, verseCount: 31, slug: "biblia-juizes-cap-16", exportName: "judges16Study", file: "judges-16-study.ts" },
  { book: "Juízes", chapter: 17, verseCount: 13, slug: "biblia-juizes-cap-17", exportName: "judges17Study", file: "judges-17-study.ts" },
  { book: "Juízes", chapter: 18, verseCount: 31, slug: "biblia-juizes-cap-18", exportName: "judges18Study", file: "judges-18-study.ts" },
  { book: "Juízes", chapter: 19, verseCount: 30, slug: "biblia-juizes-cap-19", exportName: "judges19Study", file: "judges-19-study.ts" },
  { book: "Juízes", chapter: 20, verseCount: 48, slug: "biblia-juizes-cap-20", exportName: "judges20Study", file: "judges-20-study.ts" },
  { book: "Juízes", chapter: 21, verseCount: 25, slug: "biblia-juizes-cap-21", exportName: "judges21Study", file: "judges-21-study.ts" },
  { book: "2 Samuel", chapter: 11, verseCount: 27, slug: "biblia-2-samuel-cap-11", exportName: "secondSamuel11Study", file: "2-samuel-11-study.ts" },
  { book: "2 Samuel", chapter: 12, verseCount: 31, slug: "biblia-2-samuel-cap-12", exportName: "secondSamuel12Study", file: "2-samuel-12-study.ts" },
  { book: "2 Samuel", chapter: 13, verseCount: 39, slug: "biblia-2-samuel-cap-13", exportName: "secondSamuel13Study", file: "2-samuel-13-study.ts" },
  { book: "2 Samuel", chapter: 14, verseCount: 33, slug: "biblia-2-samuel-cap-14", exportName: "secondSamuel14Study", file: "2-samuel-14-study.ts" },
  { book: "2 Samuel", chapter: 15, verseCount: 37, slug: "biblia-2-samuel-cap-15", exportName: "secondSamuel15Study", file: "2-samuel-15-study.ts" },
  { book: "2 Samuel", chapter: 16, verseCount: 23, slug: "biblia-2-samuel-cap-16", exportName: "secondSamuel16Study", file: "2-samuel-16-study.ts" },
  { book: "2 Samuel", chapter: 17, verseCount: 29, slug: "biblia-2-samuel-cap-17", exportName: "secondSamuel17Study", file: "2-samuel-17-study.ts" },
  { book: "2 Samuel", chapter: 18, verseCount: 33, slug: "biblia-2-samuel-cap-18", exportName: "secondSamuel18Study", file: "2-samuel-18-study.ts" },
  { book: "2 Samuel", chapter: 19, verseCount: 43, slug: "biblia-2-samuel-cap-19", exportName: "secondSamuel19Study", file: "2-samuel-19-study.ts" },
  { book: "2 Samuel", chapter: 20, verseCount: 26, slug: "biblia-2-samuel-cap-20", exportName: "secondSamuel20Study", file: "2-samuel-20-study.ts" },
  { book: "2 Samuel", chapter: 21, verseCount: 22, slug: "biblia-2-samuel-cap-21", exportName: "secondSamuel21Study", file: "2-samuel-21-study.ts" },
  { book: "2 Samuel", chapter: 22, verseCount: 51, slug: "biblia-2-samuel-cap-22", exportName: "secondSamuel22Study", file: "2-samuel-22-study.ts" },
  { book: "2 Samuel", chapter: 23, verseCount: 39, slug: "biblia-2-samuel-cap-23", exportName: "secondSamuel23Study", file: "2-samuel-23-study.ts" },
  { book: "2 Samuel", chapter: 24, verseCount: 25, slug: "biblia-2-samuel-cap-24", exportName: "secondSamuel24Study", file: "2-samuel-24-study.ts" },
  { book: "1 Reis", chapter: 1, verseCount: 53, slug: "biblia-1-reis-cap-1", exportName: "firstKings1Study", file: "1-kings-1-study.ts" },
  { book: "1 Reis", chapter: 2, verseCount: 46, slug: "biblia-1-reis-cap-2", exportName: "firstKings2Study", file: "1-kings-2-study.ts" },
  { book: "1 Reis", chapter: 3, verseCount: 28, slug: "biblia-1-reis-cap-3", exportName: "firstKings3Study", file: "1-kings-3-study.ts" },
  { book: "1 Reis", chapter: 4, verseCount: 34, slug: "biblia-1-reis-cap-4", exportName: "firstKings4Study", file: "1-kings-4-study.ts" },
  { book: "1 Reis", chapter: 5, verseCount: 18, slug: "biblia-1-reis-cap-5", exportName: "firstKings5Study", file: "1-kings-5-study.ts" },
  { book: "1 Reis", chapter: 6, verseCount: 38, slug: "biblia-1-reis-cap-6", exportName: "firstKings6Study", file: "1-kings-6-study.ts" },
  { book: "1 Reis", chapter: 7, verseCount: 51, slug: "biblia-1-reis-cap-7", exportName: "firstKings7Study", file: "1-kings-7-study.ts" },
  { book: "1 Reis", chapter: 8, verseCount: 66, slug: "biblia-1-reis-cap-8", exportName: "firstKings8Study", file: "1-kings-8-study.ts" },
  { book: "1 Reis", chapter: 9, verseCount: 28, slug: "biblia-1-reis-cap-9", exportName: "firstKings9Study", file: "1-kings-9-study.ts" },
  { book: "1 Reis", chapter: 10, verseCount: 29, slug: "biblia-1-reis-cap-10", exportName: "firstKings10Study", file: "1-kings-10-study.ts" },
  { book: "1 Reis", chapter: 11, verseCount: 43, slug: "biblia-1-reis-cap-11", exportName: "firstKings11Study", file: "1-kings-11-study.ts" },
  { book: "1 Reis", chapter: 12, verseCount: 33, slug: "biblia-1-reis-cap-12", exportName: "firstKings12Study", file: "1-kings-12-study.ts" },
  { book: "1 Reis", chapter: 13, verseCount: 34, slug: "biblia-1-reis-cap-13", exportName: "firstKings13Study", file: "1-kings-13-study.ts" },
  { book: "1 Reis", chapter: 14, verseCount: 31, slug: "biblia-1-reis-cap-14", exportName: "firstKings14Study", file: "1-kings-14-study.ts" },
  { book: "1 Reis", chapter: 15, verseCount: 34, slug: "biblia-1-reis-cap-15", exportName: "firstKings15Study", file: "1-kings-15-study.ts" },
  { book: "1 Reis", chapter: 16, verseCount: 34, slug: "biblia-1-reis-cap-16", exportName: "firstKings16Study", file: "1-kings-16-study.ts" },
  { book: "1 Reis", chapter: 17, verseCount: 24, slug: "biblia-1-reis-cap-17", exportName: "firstKings17Study", file: "1-kings-17-study.ts" },
  { book: "1 Reis", chapter: 18, verseCount: 46, slug: "biblia-1-reis-cap-18", exportName: "firstKings18Study", file: "1-kings-18-study.ts" },
  { book: "1 Reis", chapter: 19, verseCount: 21, slug: "biblia-1-reis-cap-19", exportName: "firstKings19Study", file: "1-kings-19-study.ts" },
  { book: "1 Reis", chapter: 20, verseCount: 43, slug: "biblia-1-reis-cap-20", exportName: "firstKings20Study", file: "1-kings-20-study.ts" },
  { book: "1 Reis", chapter: 21, verseCount: 29, slug: "biblia-1-reis-cap-21", exportName: "firstKings21Study", file: "1-kings-21-study.ts" },
  { book: "1 Reis", chapter: 22, verseCount: 53, slug: "biblia-1-reis-cap-22", exportName: "firstKings22Study", file: "1-kings-22-study.ts" },
  { book: "2 Reis", chapter: 1, verseCount: 18, slug: "biblia-2-reis-cap-1", exportName: "secondKings1Study", file: "2-kings-1-study.ts" },
  { book: "2 Reis", chapter: 2, verseCount: 25, slug: "biblia-2-reis-cap-2", exportName: "secondKings2Study", file: "2-kings-2-study.ts" },
  { book: "2 Reis", chapter: 3, verseCount: 27, slug: "biblia-2-reis-cap-3", exportName: "secondKings3Study", file: "2-kings-3-study.ts" },
  { book: "2 Reis", chapter: 4, verseCount: 44, slug: "biblia-2-reis-cap-4", exportName: "secondKings4Study", file: "2-kings-4-study.ts" },
  { book: "2 Reis", chapter: 5, verseCount: 27, slug: "biblia-2-reis-cap-5", exportName: "secondKings5Study", file: "2-kings-5-study.ts" },
  { book: "2 Reis", chapter: 6, verseCount: 33, slug: "biblia-2-reis-cap-6", exportName: "secondKings6Study", file: "2-kings-6-study.ts" },
  { book: "2 Reis", chapter: 7, verseCount: 20, slug: "biblia-2-reis-cap-7", exportName: "secondKings7Study", file: "2-kings-7-study.ts" },
  { book: "2 Reis", chapter: 8, verseCount: 29, slug: "biblia-2-reis-cap-8", exportName: "secondKings8Study", file: "2-kings-8-study.ts" },
  { book: "2 Reis", chapter: 9, verseCount: 37, slug: "biblia-2-reis-cap-9", exportName: "secondKings9Study", file: "2-kings-9-study.ts" },
  { book: "2 Reis", chapter: 10, verseCount: 36, slug: "biblia-2-reis-cap-10", exportName: "secondKings10Study", file: "2-kings-10-study.ts" },
  { book: "2 Reis", chapter: 11, verseCount: 21, slug: "biblia-2-reis-cap-11", exportName: "secondKings11Study", file: "2-kings-11-study.ts" },
  { book: "2 Reis", chapter: 12, verseCount: 21, slug: "biblia-2-reis-cap-12", exportName: "secondKings12Study", file: "2-kings-12-study.ts" },
  { book: "2 Reis", chapter: 13, verseCount: 25, slug: "biblia-2-reis-cap-13", exportName: "secondKings13Study", file: "2-kings-13-study.ts" },
  { book: "2 Reis", chapter: 14, verseCount: 29, slug: "biblia-2-reis-cap-14", exportName: "secondKings14Study", file: "2-kings-14-study.ts" },
  { book: "2 Reis", chapter: 15, verseCount: 38, slug: "biblia-2-reis-cap-15", exportName: "secondKings15Study", file: "2-kings-15-study.ts" },
  { book: "2 Reis", chapter: 16, verseCount: 20, slug: "biblia-2-reis-cap-16", exportName: "secondKings16Study", file: "2-kings-16-study.ts" },
  { book: "2 Reis", chapter: 17, verseCount: 41, slug: "biblia-2-reis-cap-17", exportName: "secondKings17Study", file: "2-kings-17-study.ts" },
  { book: "2 Reis", chapter: 18, verseCount: 37, slug: "biblia-2-reis-cap-18", exportName: "secondKings18Study", file: "2-kings-18-study.ts" },
  { book: "2 Reis", chapter: 19, verseCount: 37, slug: "biblia-2-reis-cap-19", exportName: "secondKings19Study", file: "2-kings-19-study.ts" },
  { book: "2 Reis", chapter: 20, verseCount: 21, slug: "biblia-2-reis-cap-20", exportName: "secondKings20Study", file: "2-kings-20-study.ts" },
  { book: "2 Reis", chapter: 21, verseCount: 26, slug: "biblia-2-reis-cap-21", exportName: "secondKings21Study", file: "2-kings-21-study.ts" },
  { book: "2 Reis", chapter: 22, verseCount: 20, slug: "biblia-2-reis-cap-22", exportName: "secondKings22Study", file: "2-kings-22-study.ts" },
  { book: "2 Reis", chapter: 23, verseCount: 37, slug: "biblia-2-reis-cap-23", exportName: "secondKings23Study", file: "2-kings-23-study.ts" },
  { book: "2 Reis", chapter: 24, verseCount: 20, slug: "biblia-2-reis-cap-24", exportName: "secondKings24Study", file: "2-kings-24-study.ts" },
  { book: "2 Reis", chapter: 25, verseCount: 30, slug: "biblia-2-reis-cap-25", exportName: "secondKings25Study", file: "2-kings-25-study.ts" },
  { book: "1 Crônicas", chapter: 1, verseCount: 54, slug: "biblia-1-cronicas-cap-1", exportName: "firstChronicles1Study", file: "1-chronicles-1-study.ts" },
  { book: "1 Crônicas", chapter: 2, verseCount: 55, slug: "biblia-1-cronicas-cap-2", exportName: "firstChronicles2Study", file: "1-chronicles-2-study.ts" },
  { book: "1 Crônicas", chapter: 3, verseCount: 24, slug: "biblia-1-cronicas-cap-3", exportName: "firstChronicles3Study", file: "1-chronicles-3-study.ts" },
  { book: "1 Crônicas", chapter: 4, verseCount: 43, slug: "biblia-1-cronicas-cap-4", exportName: "firstChronicles4Study", file: "1-chronicles-4-study.ts" },
  { book: "1 Crônicas", chapter: 5, verseCount: 26, slug: "biblia-1-cronicas-cap-5", exportName: "firstChronicles5Study", file: "1-chronicles-5-study.ts" },
  { book: "1 Crônicas", chapter: 6, verseCount: 81, slug: "biblia-1-cronicas-cap-6", exportName: "firstChronicles6Study", file: "1-chronicles-6-study.ts" },
  { book: "1 Crônicas", chapter: 7, verseCount: 40, slug: "biblia-1-cronicas-cap-7", exportName: "firstChronicles7Study", file: "1-chronicles-7-study.ts" },
  { book: "1 Crônicas", chapter: 8, verseCount: 40, slug: "biblia-1-cronicas-cap-8", exportName: "firstChronicles8Study", file: "1-chronicles-8-study.ts" },
  { book: "1 Crônicas", chapter: 9, verseCount: 34, slug: "biblia-1-cronicas-cap-9", exportName: "firstChronicles9Study", file: "1-chronicles-9-study.ts" },
  { book: "1 Crônicas", chapter: 10, verseCount: 14, slug: "biblia-1-cronicas-cap-10", exportName: "firstChronicles10Study", file: "1-chronicles-10-study.ts" },
  { book: "1 Crônicas", chapter: 11, verseCount: 47, slug: "biblia-1-cronicas-cap-11", exportName: "firstChronicles11Study", file: "1-chronicles-11-study.ts" },
  { book: "1 Crônicas", chapter: 12, verseCount: 40, slug: "biblia-1-cronicas-cap-12", exportName: "firstChronicles12Study", file: "1-chronicles-12-study.ts" },
  { book: "1 Crônicas", chapter: 13, verseCount: 14, slug: "biblia-1-cronicas-cap-13", exportName: "firstChronicles13Study", file: "1-chronicles-13-study.ts" },
  { book: "1 Crônicas", chapter: 14, verseCount: 17, slug: "biblia-1-cronicas-cap-14", exportName: "firstChronicles14Study", file: "1-chronicles-14-study.ts" },
  { book: "1 Crônicas", chapter: 15, verseCount: 29, slug: "biblia-1-cronicas-cap-15", exportName: "firstChronicles15Study", file: "1-chronicles-15-study.ts" },
  { book: "1 Crônicas", chapter: 16, verseCount: 43, slug: "biblia-1-cronicas-cap-16", exportName: "firstChronicles16Study", file: "1-chronicles-16-study.ts" },
  { book: "1 Crônicas", chapter: 17, verseCount: 27, slug: "biblia-1-cronicas-cap-17", exportName: "firstChronicles17Study", file: "1-chronicles-17-study.ts" },
  { book: "1 Crônicas", chapter: 18, verseCount: 17, slug: "biblia-1-cronicas-cap-18", exportName: "firstChronicles18Study", file: "1-chronicles-18-study.ts" },
  { book: "1 Crônicas", chapter: 19, verseCount: 19, slug: "biblia-1-cronicas-cap-19", exportName: "firstChronicles19Study", file: "1-chronicles-19-study.ts" },
  { book: "1 Crônicas", chapter: 20, verseCount: 8, slug: "biblia-1-cronicas-cap-20", exportName: "firstChronicles20Study", file: "1-chronicles-20-study.ts" },
  { book: "1 Crônicas", chapter: 21, verseCount: 30, slug: "biblia-1-cronicas-cap-21", exportName: "firstChronicles21Study", file: "1-chronicles-21-study.ts" },
  { book: "1 Crônicas", chapter: 22, verseCount: 19, slug: "biblia-1-cronicas-cap-22", exportName: "firstChronicles22Study", file: "1-chronicles-22-study.ts" },
  { book: "1 Crônicas", chapter: 23, verseCount: 32, slug: "biblia-1-cronicas-cap-23", exportName: "firstChronicles23Study", file: "1-chronicles-23-study.ts" },
  { book: "1 Crônicas", chapter: 24, verseCount: 31, slug: "biblia-1-cronicas-cap-24", exportName: "firstChronicles24Study", file: "1-chronicles-24-study.ts" },
  { book: "1 Crônicas", chapter: 25, verseCount: 31, slug: "biblia-1-cronicas-cap-25", exportName: "firstChronicles25Study", file: "1-chronicles-25-study.ts" },
  { book: "1 Crônicas", chapter: 26, verseCount: 32, slug: "biblia-1-cronicas-cap-26", exportName: "firstChronicles26Study", file: "1-chronicles-26-study.ts" },
  { book: "1 Crônicas", chapter: 27, verseCount: 34, slug: "biblia-1-cronicas-cap-27", exportName: "firstChronicles27Study", file: "1-chronicles-27-study.ts" },
  { book: "1 Crônicas", chapter: 28, verseCount: 21, slug: "biblia-1-cronicas-cap-28", exportName: "firstChronicles28Study", file: "1-chronicles-28-study.ts" },
  { book: "1 Crônicas", chapter: 29, verseCount: 30, slug: "biblia-1-cronicas-cap-29", exportName: "firstChronicles29Study", file: "1-chronicles-29-study.ts" },
  { book: "2 Crônicas", chapter: 1, verseCount: 17, slug: "biblia-2-cronicas-cap-1", exportName: "secondChronicles1Study", file: "2-chronicles-1-study.ts" },
  { book: "2 Crônicas", chapter: 2, verseCount: 18, slug: "biblia-2-cronicas-cap-2", exportName: "secondChronicles2Study", file: "2-chronicles-2-study.ts" },
  { book: "2 Crônicas", chapter: 3, verseCount: 17, slug: "biblia-2-cronicas-cap-3", exportName: "secondChronicles3Study", file: "2-chronicles-3-study.ts" },
  { book: "2 Crônicas", chapter: 4, verseCount: 22, slug: "biblia-2-cronicas-cap-4", exportName: "secondChronicles4Study", file: "2-chronicles-4-study.ts" },
  { book: "2 Crônicas", chapter: 5, verseCount: 14, slug: "biblia-2-cronicas-cap-5", exportName: "secondChronicles5Study", file: "2-chronicles-5-study.ts" },
  { book: "2 Crônicas", chapter: 6, verseCount: 42, slug: "biblia-2-cronicas-cap-6", exportName: "secondChronicles6Study", file: "2-chronicles-6-study.ts" },
  { book: "2 Crônicas", chapter: 7, verseCount: 22, slug: "biblia-2-cronicas-cap-7", exportName: "secondChronicles7Study", file: "2-chronicles-7-study.ts" },
  { book: "2 Crônicas", chapter: 8, verseCount: 18, slug: "biblia-2-cronicas-cap-8", exportName: "secondChronicles8Study", file: "2-chronicles-8-study.ts" },
  { book: "2 Crônicas", chapter: 9, verseCount: 31, slug: "biblia-2-cronicas-cap-9", exportName: "secondChronicles9Study", file: "2-chronicles-9-study.ts" },
  { book: "2 Crônicas", chapter: 10, verseCount: 19, slug: "biblia-2-cronicas-cap-10", exportName: "secondChronicles10Study", file: "2-chronicles-10-study.ts" },
  { book: "2 Crônicas", chapter: 11, verseCount: 23, slug: "biblia-2-cronicas-cap-11", exportName: "secondChronicles11Study", file: "2-chronicles-11-study.ts" },
  { book: "2 Crônicas", chapter: 12, verseCount: 16, slug: "biblia-2-cronicas-cap-12", exportName: "secondChronicles12Study", file: "2-chronicles-12-study.ts" },
  { book: "2 Crônicas", chapter: 13, verseCount: 22, slug: "biblia-2-cronicas-cap-13", exportName: "secondChronicles13Study", file: "2-chronicles-13-study.ts" },
  { book: "2 Crônicas", chapter: 14, verseCount: 15, slug: "biblia-2-cronicas-cap-14", exportName: "secondChronicles14Study", file: "2-chronicles-14-study.ts" },
  { book: "2 Crônicas", chapter: 15, verseCount: 19, slug: "biblia-2-cronicas-cap-15", exportName: "secondChronicles15Study", file: "2-chronicles-15-study.ts" },
  { book: "2 Crônicas", chapter: 16, verseCount: 14, slug: "biblia-2-cronicas-cap-16", exportName: "secondChronicles16Study", file: "2-chronicles-16-study.ts" },
  { book: "2 Crônicas", chapter: 17, verseCount: 19, slug: "biblia-2-cronicas-cap-17", exportName: "secondChronicles17Study", file: "2-chronicles-17-study.ts" },
  { book: "2 Crônicas", chapter: 18, verseCount: 34, slug: "biblia-2-cronicas-cap-18", exportName: "secondChronicles18Study", file: "2-chronicles-18-study.ts" },
  { book: "2 Crônicas", chapter: 19, verseCount: 11, slug: "biblia-2-cronicas-cap-19", exportName: "secondChronicles19Study", file: "2-chronicles-19-study.ts" },
  { book: "2 Crônicas", chapter: 20, verseCount: 37, slug: "biblia-2-cronicas-cap-20", exportName: "secondChronicles20Study", file: "2-chronicles-20-study.ts" },
  { book: "2 Crônicas", chapter: 21, verseCount: 20, slug: "biblia-2-cronicas-cap-21", exportName: "secondChronicles21Study", file: "2-chronicles-21-study.ts" },
  { book: "2 Crônicas", chapter: 22, verseCount: 12, slug: "biblia-2-cronicas-cap-22", exportName: "secondChronicles22Study", file: "2-chronicles-22-study.ts" },
  { book: "2 Crônicas", chapter: 23, verseCount: 21, slug: "biblia-2-cronicas-cap-23", exportName: "secondChronicles23Study", file: "2-chronicles-23-study.ts" },
  { book: "2 Crônicas", chapter: 24, verseCount: 27, slug: "biblia-2-cronicas-cap-24", exportName: "secondChronicles24Study", file: "2-chronicles-24-study.ts" },
  { book: "2 Crônicas", chapter: 25, verseCount: 28, slug: "biblia-2-cronicas-cap-25", exportName: "secondChronicles25Study", file: "2-chronicles-25-study.ts" },
  { book: "2 Crônicas", chapter: 26, verseCount: 23, slug: "biblia-2-cronicas-cap-26", exportName: "secondChronicles26Study", file: "2-chronicles-26-study.ts" },
  { book: "2 Crônicas", chapter: 27, verseCount: 9, slug: "biblia-2-cronicas-cap-27", exportName: "secondChronicles27Study", file: "2-chronicles-27-study.ts" },
  { book: "2 Crônicas", chapter: 28, verseCount: 27, slug: "biblia-2-cronicas-cap-28", exportName: "secondChronicles28Study", file: "2-chronicles-28-study.ts" },
  { book: "2 Crônicas", chapter: 29, verseCount: 36, slug: "biblia-2-cronicas-cap-29", exportName: "secondChronicles29Study", file: "2-chronicles-29-study.ts" },
  { book: "2 Crônicas", chapter: 30, verseCount: 27, slug: "biblia-2-cronicas-cap-30", exportName: "secondChronicles30Study", file: "2-chronicles-30-study.ts" },
  { book: "2 Crônicas", chapter: 31, verseCount: 21, slug: "biblia-2-cronicas-cap-31", exportName: "secondChronicles31Study", file: "2-chronicles-31-study.ts" },
  { book: "2 Crônicas", chapter: 32, verseCount: 33, slug: "biblia-2-cronicas-cap-32", exportName: "secondChronicles32Study", file: "2-chronicles-32-study.ts" },
  { book: "2 Crônicas", chapter: 33, verseCount: 25, slug: "biblia-2-cronicas-cap-33", exportName: "secondChronicles33Study", file: "2-chronicles-33-study.ts" },
  { book: "2 Crônicas", chapter: 34, verseCount: 33, slug: "biblia-2-cronicas-cap-34", exportName: "secondChronicles34Study", file: "2-chronicles-34-study.ts" },
  { book: "2 Crônicas", chapter: 35, verseCount: 27, slug: "biblia-2-cronicas-cap-35", exportName: "secondChronicles35Study", file: "2-chronicles-35-study.ts" },
  { book: "2 Crônicas", chapter: 36, verseCount: 23, slug: "biblia-2-cronicas-cap-36", exportName: "secondChronicles36Study", file: "2-chronicles-36-study.ts" },
];

async function readContent(path) {
  return readFile(new URL("../" + path, import.meta.url), "utf8");
}

function extractSectionReferences(source) {
  const arrays = [...source.matchAll(/["']?scriptureRefs["']?\s*:\s*\[([\s\S]*?)\]/g)];
  return arrays.flatMap(([, section]) =>
    [...section.matchAll(/["'`]([^"'`]+)["'`]/g)].flatMap(([, reference]) =>
      reference.split(";").map((part) => part.trim()).filter(Boolean),
    ),
  );
}

describe("estudos bíblicos curados: registro e cobertura das perícopes", () => {
  it("mantém Gênesis 1 registrado como referência curada", async () => {
    const registry = await readContent("src/lib/content/curated-studies.ts");
    assert.match(registry, /["']genesis-1-criacao["']\s*:\s*genesis1Study/);
  });

  for (const study of curatedBatch) {
    it(study.book + " " + study.chapter + " está registrado e cobre todos os versículos nas seções", async () => {
      const source = await readContent("src/lib/content/" + study.file);
      const registry = await readContent("src/lib/content/curated-studies.ts");
      const fileBase = study.file.replace(/\.ts$/, "");

      assert.match(
        registry,
        new RegExp("import\\s*\\{\\s*" + study.exportName + "\\s*\\}\\s*from\\s*[\"']\\./" + fileBase + "[\"']"),
        "o arquivo do estudo precisa ser importado pelo catálogo curado",
      );
      assert.match(
        registry,
        new RegExp("[\"']" + study.slug + "[\"']\\s*:\\s*" + study.exportName),
        "o estudo precisa estar associado ao slug canônico",
      );

      const references = extractSectionReferences(source);
      assert.ok(references.length > 0, "o estudo precisa declarar referências nas seções");

      const chapterPattern = new RegExp(
        "^" + study.book + "\\s+" + study.chapter + ":\\s*(\\d+)(?:\\s*[–—-]\\s*(\\d+))?$",
        "u",
      );
      const covered = new Set();
      const chapterReferences = references.filter((reference) =>
        reference.startsWith(study.book + " " + study.chapter + ":"),
      );

      assert.ok(chapterReferences.length > 0, "nenhuma perícope do próprio capítulo foi encontrada");

      for (const reference of chapterReferences) {
        const match = chapterPattern.exec(reference);
        assert.ok(match, "referência do capítulo não reconhecida: " + reference);
        const firstVerse = Number(match[1]);
        const lastVerse = Number(match[2] ?? match[1]);

        assert.ok(firstVerse >= 1 && lastVerse >= firstVerse, "intervalo inválido: " + reference);
        assert.ok(lastVerse <= study.verseCount, "referência ultrapassa o capítulo: " + reference);

        for (let verse = firstVerse; verse <= lastVerse; verse += 1) covered.add(verse);
      }

      const missing = Array.from({ length: study.verseCount }, (_, index) => index + 1)
        .filter((verse) => !covered.has(verse));
      assert.deepEqual(missing, [], "versículos sem cobertura nas seções: " + missing.join(", "));
    });
  }
});
