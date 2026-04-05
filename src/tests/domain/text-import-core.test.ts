import { describe, expect, it } from "vitest";

import { parseCoreImportSections } from "@/domain/import/core-parser";
import { detectImportSections } from "@/domain/import/section-detector";
import { loadTextImportFixture } from "@/tests/helpers/text-import-fixture";

describe("text import core parsing", () => {
  it("parses Ornstal identity, attributes, runes, and passions", async () => {
    const text = await loadTextImportFixture("Ornstal");
    const sections = detectImportSections(text);

    const result = parseCoreImportSections(sections);

    expect(result.characterInfo.candidateName).toBe("Ornstal the Quick");
    expect(result.characterInfo.family).toBe("Lorionaeo");
    expect(result.characterInfo.patron).toBe("Marele");
    expect(result.characterInfo.dateOfBirth).toBe("1604 SR");
    expect(result.characterInfo.occupation).toBe("Scribe");
    expect(result.characterInfo.reputation).toBe(12);
    expect(result.characterInfo.sol).toBe("Free");
    expect(result.characterInfo.income).toBe("120L");
    expect(result.characterInfo.ransom).toBe(1000);
    expect(result.characterInfo.cult).toBe("LHANKOR MHY");
    expect(result.attributes.str).toBe(12);
    expect(result.attributes.pow).toBe(17);
    expect(result.runePercentages.fire).toBe(80);
    expect(result.runePercentages.truth).toBe(75);
    expect(result.runePercentages.illusion).toBe(25);
    expect(result.characterInfo.honor).toBe(60);
    expect(
      result.passions.some(
        (passion) => passion.name === "Love (family)" && passion.percentage === 60,
      ),
    ).toBe(true);
  });

  it("parses Selina cult and additional worships", async () => {
    const text = await loadTextImportFixture("Selina");
    const sections = detectImportSections(text);

    const result = parseCoreImportSections(sections);

    expect(result.characterInfo.candidateName).toBe("SELINA");
    expect(result.characterInfo.originalHouse).toBe("IRNILHA");
    expect(result.characterInfo.cult).toBe("ISSARIES");
    expect(result.characterInfo.worships).toEqual(["LANBRIL"]);
    expect(result.attributes.dex).toBe(19);
    expect(result.runePercentages.disorder).toBe(75);
  });
});
