import { describe, expect, it } from "vitest";
import { CURATED_STUDIES } from "./curated-studies";
import { proverbs30Study } from "./proverbs-30-study";
import { proverbs31Study } from "./proverbs-31-study";

describe("Revisão editorial de Provérbios 30–31", () => {
  for (const [chapter, total, study] of [[30, 33, proverbs30Study], [31, 31, proverbs31Study]] as const) {
    it(`mantém ${chapter} no catálogo e ${total} comentários específicos`, () => {
      expect(CURATED_STUDIES[`biblia-proverbios-cap-${chapter}`]).toBe(study);
      const ids = new Set(study.sections.map((section) => section.id));
      expect(ids.size).toBe(study.sections.length);
      for (let verse = 1; verse <= total; verse++) {
        const section = study.sections.find((item) => item.id === `versiculo-${verse}`);
        expect(section?.scriptureRefs).toContain(`Provérbios ${chapter}:${verse}`);
        expect(section?.body).toContain("Exposição e limites interpretativos");
        expect(section?.body).not.toContain("A frase deve ser examinada em sua própria forma");
      }
    });
  }
});
