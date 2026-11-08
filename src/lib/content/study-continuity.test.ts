import { describe, expect, test } from "bun:test";
import { getChapterStudy, getChapterStudySlug } from "./bible-books";
import { CURATED_STUDIES } from "./curated-studies";
import { getStudy, STUDIES } from "./studies";

describe("continuidade dos estudos de Gênesis", () => {
  test("preserva o endereço de Gênesis 1", () => {
    expect(getChapterStudySlug("genesis", 1)).toBe("genesis-1-criacao");
    expect(CURATED_STUDIES["genesis-1-criacao"]?.depth).toBe("deep");
  });
  test("Gênesis 2 usa o endereço existente sem duplicar o catálogo", () => {
    const slug = getChapterStudySlug("genesis", 2);
    expect(slug).toBe("biblia-genesis-cap-2");
    expect(STUDIES.filter((study) => study.slug === slug)).toHaveLength(1);
    expect(getStudy(slug)?.depth).toBe("deep");
    expect(getChapterStudy(slug)?.chapter).toBe(2);
    expect(CURATED_STUDIES[slug]?.depth).toBe("deep");
  });
  test("não acrescenta conteúdo curado de Gênesis 3", () => {
    expect(CURATED_STUDIES[getChapterStudySlug("genesis", 3)]).toBeUndefined();
  });
});