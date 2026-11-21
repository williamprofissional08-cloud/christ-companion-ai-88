import { describe, expect, it } from "vitest";
import { proverbs29Study } from "./proverbs-29-study";
import { CURATED_STUDIES } from "./curated-studies";

describe("Provérbios 29 — revisão de comentários", () => {
  it("mantém a integração canônica", () => {
    expect(CURATED_STUDIES["biblia-proverbios-cap-29"]).toBe(proverbs29Study);
  });
  it("possui 27 exposições específicas sem o modelo genérico anterior", () => {
    for (let verse = 1; verse <= 27; verse++) {
      const section = proverbs29Study.sections.find((item) => item.id === `versiculo-${verse}`);
      expect(section?.body).toContain("Observação e interpretação");
      expect(section?.body).toContain("Aplicação contemporânea");
      expect(section?.body).not.toContain("A frase deve ser examinada em sua própria forma");
      expect(section?.scriptureRefs).toContain(`Provérbios 29:${verse}`);
    }
  });
});
