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
  test("Gênesis 3 possui estudo profundo curado no endereço canônico", () => {
    const slug = getChapterStudySlug("genesis", 3);
    assert.equal(slug, "biblia-genesis-cap-3");
    assert.equal(STUDIES.filter((study) => study.slug === slug).length, 1);
    assert.equal(getStudy(slug)?.depth, "deep");
    assert.equal(getChapterStudy(slug)?.chapter, 3);
    assert.equal(CURATED_STUDIES[slug]?.depth, "deep");
    assert.equal(CURATED_STUDIES[slug]?.sections?.length, 15);
  });
  test("Gênesis 44 possui estudo profundo curado no endereço canônico", () => {
    const slug = getChapterStudySlug("genesis", 44);
    assert.equal(slug, "biblia-genesis-cap-44");
    assert.equal(getStudy(slug)?.depth, "deep");
    assert.equal(getChapterStudy(slug)?.chapter, 44);
    assert.equal(CURATED_STUDIES[slug]?.depth, "deep");
    assert.equal(CURATED_STUDIES[slug]?.sections?.length, 12);
  });
  test("Gênesis 46 a 50 estão registrados como estudos profundos", () => {
    for (let chapter = 46; chapter <= 50; chapter += 1) {
      const slug = getChapterStudySlug("genesis", chapter);
      assert.equal(slug, `biblia-genesis-cap-${chapter}`);
      assert.equal(getChapterStudy(slug)?.chapter, chapter);
      assert.equal(CURATED_STUDIES[slug]?.depth, "deep");
      assert.ok((CURATED_STUDIES[slug]?.sections?.length ?? 0) > 0);
    }
  });
  test("Êxodo 1 está registrado no endereço canônico do livro", () => {
    const slug = getChapterStudySlug("exodo", 1);
    assert.equal(slug, "biblia-exodo-cap-1");
    assert.equal(getChapterStudy(slug)?.book.slug, "exodo");
    assert.equal(CURATED_STUDIES[slug]?.depth, "deep");
    assert.equal(CURATED_STUDIES[slug]?.sections?.length, 12);
  });

  test("Êxodo 2 a 10 possuem estudos profundos no catálogo canônico", () => {
    for (let chapter = 2; chapter <= 10; chapter += 1) {
      const slug = getChapterStudySlug("exodo", chapter);
      assert.equal(slug, `biblia-exodo-cap-${chapter}`);
      assert.equal(getChapterStudy(slug)?.book.slug, "exodo");
      assert.equal(getChapterStudy(slug)?.chapter, chapter);
      assert.equal(CURATED_STUDIES[slug]?.depth, "deep");
      assert.ok((CURATED_STUDIES[slug]?.sections?.length ?? 0) >= 7);
      assert.ok((CURATED_STUDIES[slug]?.questions?.length ?? 0) >= 10);
    }
  });


  test("Gênesis 11 a 20 possuem estudos profundos completos no catálogo canônico", () => {
    for (let chapter = 11; chapter <= 20; chapter += 1) {
      const slug = getChapterStudySlug("genesis", chapter);
      const study = CURATED_STUDIES[slug];
      assert.equal(slug, `biblia-genesis-cap-${chapter}`);
      assert.equal(getChapterStudy(slug)?.book.slug, "genesis");
      assert.equal(getChapterStudy(slug)?.chapter, chapter);
      assert.equal(getStudy(slug)?.depth, "deep");
      assert.equal(study?.depth, "deep");
      assert.ok((study?.sections?.length ?? 0) >= 20, `Gênesis ${chapter} precisa de pelo menos 20 seções didáticas`);
      assert.ok((study?.questions?.length ?? 0) >= 12, `Gênesis ${chapter} precisa de pelo menos 12 perguntas`);
      assert.ok(study?.sections?.some((section) => /método de (exegese|estudo)/i.test(section.title)));
      assert.ok(study?.sections?.some((section) => /preparação de (aula|mensagem)/i.test(section.title)));
      assert.ok(study?.sections?.some((section) => /glossário/i.test(section.title)));
      assert.ok(study?.sections?.some((section) => /(avaliação|revisão)/i.test(section.title)));
      assert.ok((study?.crossReferences?.length ?? 0) >= 5);
      assert.ok(Boolean(study?.application?.trim()));
      assert.ok(Boolean(study?.conclusion?.trim()));
      assert.ok(Boolean(study?.prayer?.trim()));
    }
  });

});
