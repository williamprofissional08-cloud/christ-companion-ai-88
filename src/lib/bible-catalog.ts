export type BibleTestament = "AT" | "NT";

export type BibleBook = {
  id: string;
  name: string;
  testament: BibleTestament;
  chapters: number;
};

const at: Array<[string, number]> = [
  ["Gênesis", 50],
  ["Êxodo", 40],
  ["Levítico", 27],
  ["Números", 36],
  ["Deuteronômio", 34],
  ["Josué", 24],
  ["Juízes", 21],
  ["Rute", 4],
  ["1 Samuel", 31],
  ["2 Samuel", 24],
  ["1 Reis", 22],
  ["2 Reis", 25],
  ["1 Crônicas", 29],
  ["2 Crônicas", 36],
  ["Esdras", 10],
  ["Neemias", 13],
  ["Ester", 10],
  ["Jó", 42],
  ["Salmos", 150],
  ["Provérbios", 31],
  ["Eclesiastes", 12],
  ["Cantares", 8],
  ["Isaías", 66],
  ["Jeremias", 52],
  ["Lamentações", 5],
  ["Ezequiel", 48],
  ["Daniel", 12],
  ["Oseias", 14],
  ["Joel", 3],
  ["Amós", 9],
  ["Obadias", 1],
  ["Jonas", 4],
  ["Miqueias", 7],
  ["Naum", 3],
  ["Habacuque", 3],
  ["Sofonias", 3],
  ["Ageu", 2],
  ["Zacarias", 14],
  ["Malaquias", 4],
];
const nt: Array<[string, number]> = [
  ["Mateus", 28],
  ["Marcos", 16],
  ["Lucas", 24],
  ["João", 21],
  ["Atos", 28],
  ["Romanos", 16],
  ["1 Coríntios", 16],
  ["2 Coríntios", 13],
  ["Gálatas", 6],
  ["Efésios", 6],
  ["Filipenses", 4],
  ["Colossenses", 4],
  ["1 Tessalonicenses", 5],
  ["2 Tessalonicenses", 3],
  ["1 Timóteo", 6],
  ["2 Timóteo", 4],
  ["Tito", 3],
  ["Filemom", 1],
  ["Hebreus", 13],
  ["Tiago", 5],
  ["1 Pedro", 5],
  ["2 Pedro", 3],
  ["1 João", 5],
  ["2 João", 1],
  ["3 João", 1],
  ["Judas", 1],
  ["Apocalipse", 22],
];

const slugify = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
export const BIBLE_BOOKS: BibleBook[] = [
  ...at.map(([name, chapters]) => ({
    id: slugify(name),
    name,
    chapters,
    testament: "AT" as const,
  })),
  ...nt.map(([name, chapters]) => ({
    id: slugify(name),
    name,
    chapters,
    testament: "NT" as const,
  })),
];

export function getBibleBook(id: string | undefined) {
  return BIBLE_BOOKS.find((book) => book.id === id) ?? BIBLE_BOOKS[0];
}

/** Parses only known canonical book names before building an internal Bible URL. */
export function parseBibleReference(reference: string | undefined) {
  if (!reference) return undefined;
  const normalized = reference.replace(/\s+/g, " ").trim();
  const matchedBook = [...BIBLE_BOOKS]
    .sort((a, b) => b.name.length - a.name.length)
    .find((book) =>
      normalized.toLocaleLowerCase("pt-BR").startsWith(book.name.toLocaleLowerCase("pt-BR")),
    );
  if (!matchedBook) return undefined;
  const tail = normalized.slice(matchedBook.name.length).trim();
  const match = /^(\d{1,3})(?::(\d{1,3}))?/.exec(tail);
  if (!match) return undefined;
  const chapter = Number(match[1]);
  if (chapter < 1 || chapter > matchedBook.chapters) return undefined;
  return {
    livro: matchedBook.id,
    capitulo: chapter,
    ...(match[2] ? { versiculo: Number(match[2]) } : {}),
  };
}
