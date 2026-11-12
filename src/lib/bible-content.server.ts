import { getBibleBook } from "./bible-catalog";

type BlivreBookData = {
  translation: "BLIVRE";
  sourceBookCode: string;
  chapters: Record<string, string[]>;
};

const bookLoaders = import.meta.glob<BlivreBookData>("./bible-livre/*.json", {
  import: "default",
});

export async function getBlivreChapterContent(bookId: string, chapter: number) {
  const book = getBibleBook(bookId);
  if (book.id !== bookId || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    throw new Error("Referência bíblica inválida.");
  }

  const loader = bookLoaders[`./bible-livre/${book.id}.json`];
  if (!loader) throw new Error("Este livro não está disponível na Bíblia BLIVRE.");

  const data = await loader();
  const chapterVerses = data.chapters[String(chapter)];
  if (!Array.isArray(chapterVerses) || chapterVerses.length === 0) {
    throw new Error("O capítulo solicitado não foi encontrado na Bíblia BLIVRE.");
  }

  return {
    translation: "BLIVRE" as const,
    bookId: book.id,
    bookName: book.name,
    chapter,
    verses: chapterVerses.map((text, index) => ({ number: index + 1, text })),
  };
}
