import { describe, expect, it } from "vitest";

import { detectTextImportSections } from "@/domain/import/section-detector";
import { loadTextImportFixture } from "@/tests/fixtures/text-import/loadFixture";

describe("text import section detector", () => {
  it("detects expected sections in Ornstal", () => {
    const detected = detectTextImportSections(loadTextImportFixture("Ornstal"));

    expect(detected.sectionContents.characterInfo?.includes("Name: Ornstal the Quick")).toBe(true);
    expect(detected.sectionContents.attributes?.includes("STR: 12")).toBe(true);
    expect(detected.sectionContents.runes?.includes("Truth | Illusion")).toBe(true);
    expect(detected.sectionContents.passions?.includes("Honor:")).toBe(true);
    expect(detected.sectionContents.equipment?.includes("Rapier")).toBe(true);
    expect(detected.sectionContents.skills?.includes("Agility")).toBe(true);
    expect(detected.sectionContents.magic?.includes("Rune Magic")).toBe(true);
    expect(detected.trailingNotes?.includes("Ornstal had a auspicion birth.")).toBe(true);
  });
});
