export type BibleBook = { slug: string; name: string; chapters: number; testament: "Antigo Testamento" | "Novo Testamento"; category: string; order: number };

/** Canonical 66-book Protestant Bible index (39 OT + 27 NT). */
export const BIBLE_BOOKS: BibleBook[] = [
  { slug: "genesis", name: "Gênesis", chapters: 50, category: "Pentateuco", testament: "Antigo Testamento", order: 1 },
  { slug: "exodo", name: "Êxodo", chapters: 40, category: "Pentateuco", testament: "Antigo Testamento", order: 2 },
  { slug: "levitico", name: "Levítico", chapters: 27, category: "Pentateuco", testament: "Antigo Testamento", order: 3 },
  { slug: "numeros", name: "Números", chapters: 36, category: "Pentateuco", testament: "Antigo Testamento", order: 4 },
  { slug: "deuteronomio", name: "Deuteronômio", chapters: 34, category: "Pentateuco", testament: "Antigo Testamento", order: 5 },
  { slug: "josue", name: "Josué", chapters: 24, category: "Históricos", testament: "Antigo Testamento", order: 6 },
  { slug: "juizes", name: "Juízes", chapters: 21, category: "Históricos", testament: "Antigo Testamento", order: 7 },
  { slug: "rute", name: "Rute", chapters: 4, category: "Históricos", testament: "Antigo Testamento", order: 8 },
  { slug: "1-samuel", name: "1 Samuel", chapters: 31, category: "Históricos", testament: "Antigo Testamento", order: 9 },
  { slug: "2-samuel", name: "2 Samuel", chapters: 24, category: "Históricos", testament: "Antigo Testamento", order: 10 },
  { slug: "1-reis", name: "1 Reis", chapters: 22, category: "Históricos", testament: "Antigo Testamento", order: 11 },
  { slug: "2-reis", name: "2 Reis", chapters: 25, category: "Históricos", testament: "Antigo Testamento", order: 12 },
  { slug: "1-cronicas", name: "1 Crônicas", chapters: 29, category: "Históricos", testament: "Antigo Testamento", order: 13 },
  { slug: "2-cronicas", name: "2 Crônicas", chapters: 36, category: "Históricos", testament: "Antigo Testamento", order: 14 },
  { slug: "esdras", name: "Esdras", chapters: 10, category: "Históricos", testament: "Antigo Testamento", order: 15 },
  { slug: "neemias", name: "Neemias", chapters: 13, category: "Históricos", testament: "Antigo Testamento", order: 16 },
  { slug: "ester", name: "Ester", chapters: 10, category: "Históricos", testament: "Antigo Testamento", order: 17 },
  { slug: "jo", name: "Jó", chapters: 42, category: "Poéticos e Sapienciais", testament: "Antigo Testamento", order: 18 },
  { slug: "salmos", name: "Salmos", chapters: 150, category: "Poéticos e Sapienciais", testament: "Antigo Testamento", order: 19 },
  { slug: "proverbios", name: "Provérbios", chapters: 31, category: "Poéticos e Sapienciais", testament: "Antigo Testamento", order: 20 },
  { slug: "eclesiastes", name: "Eclesiastes", chapters: 12, category: "Poéticos e Sapienciais", testament: "Antigo Testamento", order: 21 },
  { slug: "cantico-dos-canticos", name: "Cântico dos Cânticos", chapters: 8, category: "Poéticos e Sapienciais", testament: "Antigo Testamento", order: 22 },
  { slug: "isaias", name: "Isaías", chapters: 66, category: "Profetas Maiores", testament: "Antigo Testamento", order: 23 },
  { slug: "jeremias", name: "Jeremias", chapters: 52, category: "Profetas Maiores", testament: "Antigo Testamento", order: 24 },
  { slug: "lamentacoes", name: "Lamentações", chapters: 5, category: "Profetas Maiores", testament: "Antigo Testamento", order: 25 },
  { slug: "ezequiel", name: "Ezequiel", chapters: 48, category: "Profetas Maiores", testament: "Antigo Testamento", order: 26 },
  { slug: "daniel", name: "Daniel", chapters: 12, category: "Profetas Maiores", testament: "Antigo Testamento", order: 27 },
  { slug: "oseias", name: "Oseias", chapters: 14, category: "Profetas Menores", testament: "Antigo Testamento", order: 28 },
  { slug: "joel", name: "Joel", chapters: 3, category: "Profetas Menores", testament: "Antigo Testamento", order: 29 },
  { slug: "amos", name: "Amós", chapters: 9, category: "Profetas Menores", testament: "Antigo Testamento", order: 30 },
  { slug: "obadias", name: "Obadias", chapters: 1, category: "Profetas Menores", testament: "Antigo Testamento", order: 31 },
  { slug: "jonas", name: "Jonas", chapters: 4, category: "Profetas Menores", testament: "Antigo Testamento", order: 32 },
  { slug: "miqueias", name: "Miqueias", chapters: 7, category: "Profetas Menores", testament: "Antigo Testamento", order: 33 },
  { slug: "naum", name: "Naum", chapters: 3, category: "Profetas Menores", testament: "Antigo Testamento", order: 34 },
  { slug: "habacuque", name: "Habacuque", chapters: 3, category: "Profetas Menores", testament: "Antigo Testamento", order: 35 },
  { slug: "sofonias", name: "Sofonias", chapters: 3, category: "Profetas Menores", testament: "Antigo Testamento", order: 36 },
  { slug: "ageu", name: "Ageu", chapters: 2, category: "Profetas Menores", testament: "Antigo Testamento", order: 37 },
  { slug: "zacarias", name: "Zacarias", chapters: 14, category: "Profetas Menores", testament: "Antigo Testamento", order: 38 },
  { slug: "malaquias", name: "Malaquias", chapters: 4, category: "Profetas Menores", testament: "Antigo Testamento", order: 39 },
  { slug: "mateus", name: "Mateus", chapters: 28, category: "Evangelhos", testament: "Novo Testamento", order: 40 },
  { slug: "marcos", name: "Marcos", chapters: 16, category: "Evangelhos", testament: "Novo Testamento", order: 41 },
  { slug: "lucas", name: "Lucas", chapters: 24, category: "Evangelhos", testament: "Novo Testamento", order: 42 },
  { slug: "joao", name: "João", chapters: 21, category: "Evangelhos", testament: "Novo Testamento", order: 43 },
  { slug: "atos", name: "Atos", chapters: 28, category: "História da Igreja", testament: "Novo Testamento", order: 44 },
  { slug: "romanos", name: "Romanos", chapters: 16, category: "Cartas Paulinas", testament: "Novo Testamento", order: 45 },
  { slug: "1-corintios", name: "1 Coríntios", chapters: 16, category: "Cartas Paulinas", testament: "Novo Testamento", order: 46 },
  { slug: "2-corintios", name: "2 Coríntios", chapters: 13, category: "Cartas Paulinas", testament: "Novo Testamento", order: 47 },
  { slug: "galatas", name: "Gálatas", chapters: 6, category: "Cartas Paulinas", testament: "Novo Testamento", order: 48 },
  { slug: "efesios", name: "Efésios", chapters: 6, category: "Cartas Paulinas", testament: "Novo Testamento", order: 49 },
  { slug: "filipenses", name: "Filipenses", chapters: 4, category: "Cartas Paulinas", testament: "Novo Testamento", order: 50 },
  { slug: "colossenses", name: "Colossenses", chapters: 4, category: "Cartas Paulinas", testament: "Novo Testamento", order: 51 },
  { slug: "1-tessalonicenses", name: "1 Tessalonicenses", chapters: 5, category: "Cartas Paulinas", testament: "Novo Testamento", order: 52 },
  { slug: "2-tessalonicenses", name: "2 Tessalonicenses", chapters: 3, category: "Cartas Paulinas", testament: "Novo Testamento", order: 53 },
  { slug: "1-timoteo", name: "1 Timóteo", chapters: 6, category: "Cartas Pastorais", testament: "Novo Testamento", order: 54 },
  { slug: "2-timoteo", name: "2 Timóteo", chapters: 4, category: "Cartas Pastorais", testament: "Novo Testamento", order: 55 },
  { slug: "tito", name: "Tito", chapters: 3, category: "Cartas Pastorais", testament: "Novo Testamento", order: 56 },
  { slug: "filemom", name: "Filemom", chapters: 1, category: "Cartas Paulinas", testament: "Novo Testamento", order: 57 },
  { slug: "hebreus", name: "Hebreus", chapters: 13, category: "Cartas Gerais", testament: "Novo Testamento", order: 58 },
  { slug: "tiago", name: "Tiago", chapters: 5, category: "Cartas Gerais", testament: "Novo Testamento", order: 59 },
  { slug: "1-pedro", name: "1 Pedro", chapters: 5, category: "Cartas Gerais", testament: "Novo Testamento", order: 60 },
  { slug: "2-pedro", name: "2 Pedro", chapters: 3, category: "Cartas Gerais", testament: "Novo Testamento", order: 61 },
  { slug: "1-joao", name: "1 João", chapters: 5, category: "Cartas Gerais", testament: "Novo Testamento", order: 62 },
  { slug: "2-joao", name: "2 João", chapters: 1, category: "Cartas Gerais", testament: "Novo Testamento", order: 63 },
  { slug: "3-joao", name: "3 João", chapters: 1, category: "Cartas Gerais", testament: "Novo Testamento", order: 64 },
  { slug: "judas", name: "Judas", chapters: 1, category: "Cartas Gerais", testament: "Novo Testamento", order: 65 },
  { slug: "apocalipse", name: "Apocalipse", chapters: 22, category: "Profecia e Apocalíptica", testament: "Novo Testamento", order: 66 },
];

export const BIBLE_CHAPTER_TOTAL = BIBLE_BOOKS.reduce((total, book) => total + book.chapters, 0);

export function getBibleBook(slug: string) { return BIBLE_BOOKS.find((book) => book.slug === slug); }

export function getChapterStudySlug(bookSlug: string, chapter: number) { return bookSlug === "genesis" && chapter === 1 ? "genesis-1-criacao" : `biblia-${bookSlug}-cap-${chapter}`; }

export function getChapterStudy(slug: string) {
  const match = /^biblia-([a-z0-9-]+)-cap-(\d+)$/.exec(slug);
  if (!match?.[1] || !match[2]) return undefined;
  const book = getBibleBook(match[1]);
  const chapter = Number(match[2]);
  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) return undefined;
  return {
    slug,
    title: `${book.name} ${chapter} — Estudo do capítulo`,
    category: book.testament,
    reference: `${book.name} ${chapter}`,
    summary: `Estudo capítulo por capítulo de ${book.name}, com exposição do texto, contexto, interpretação, conexão bíblica com Cristo e aplicação.`,
    depth: "deep" as const,
    book,
    chapter,
  };
}
