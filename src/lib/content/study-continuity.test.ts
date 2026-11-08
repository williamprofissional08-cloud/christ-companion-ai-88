import { describe, it as test } from "node:test";
import { strict as assert } from "node:assert";
import { getChapterStudy, getChapterStudySlug } from "./bible-books";
import { CURATED_STUDIES } from "./curated-studies";
import { getStudy, STUDIES } from "./studies";

describe("continuidade dos estudos de Gênesis", () => {
  test("preserva o endereço de Gênesis 1", () => {
    assert.equal(getChapterStudySlug("genesis", 1), "genesis-1-criacao");
    assert.equal(CURATED_STUDIES["genesis-1-criacao"]?.depth, "deep");
  });
  test("Gênesis 2 usa o endereço existente sem duplicar o catálogo", () => {
    const slug = getChapterStudySlug("genesis", 2);
    assert.equal(slug, "biblia-genesis-cap-2");
    assert.equal(STUDIES.filter((study) => study.slug === slug).length, 1);
    assert.equal(getStudy(slug)?.depth, "deep");
    assert.equal(getChapterStudy(slug)?.chapter, 2);
    assert.equal(CURATED_STUDIES[slug]?.depth, "deep");
  });
  test("não acrescenta conteúdo curado de Gênesis 3", () => {
    assert.equal(CURATED_STUDIES[getChapterStudySlug("genesis", 3)], undefined);
  });
});