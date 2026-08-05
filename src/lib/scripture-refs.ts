/** Detecta referências bíblicas no formato "Livro capítulo:versículo". */
const REFERENCE_REGEX =
  /((?:[1-3]\s*(?:º|ª)?\s*)?[A-ZÀ-Ý][\wÀ-ÿ]{1,20}(?:\s+(?:de|dos|das|da)\s+[A-ZÀ-Ýa-zà-ÿ][\wÀ-ÿ]{1,20})?\s*\d{1,3}\s*:\s*\d{1,3}(?:\s*[-–,]\s*\d{1,3})*)/g;

export function extractReferences(text: string): string[] {
  if (!text) return [];
  const found = text.match(REFERENCE_REGEX) ?? [];
  const cleaned = found.map((r) => r.replace(/\s+/g, " ").trim());
  return [...new Set(cleaned)];
}

export function hasReference(text: string): boolean {
  return extractReferences(text).length > 0;
}
