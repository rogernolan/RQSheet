import { describe, expect, it } from "vitest";

import { parseTextImportEquipmentAndMagic } from "@/domain/import/equipment-magic-parser";
import { detectTextImportSections } from "@/domain/import/section-detector";
import { loadTextImportFixture } from "@/tests/fixtures/text-import/loadFixture";

describe("text import equipment and magic parser", () => {
  it("parses Ornstal weapons, equipment, magic, and trailing notes", () => {
    const text = loadTextImportFixture("Ornstal");
    const sections = detectTextImportSections(text);

    const result = parseTextImportEquipmentAndMagic(sections);

    expect(
      result.weapons.some(
        (weapon) =>
          weapon.name === "Rapier" &&
          weapon.percentage === 30 &&
          weapon.damage === "1d6+1",
      ),
    ).toBe(true);
    expect(
      result.equipment.includes(
        "Writing implements and materials (with small wooden carrying case)",
      ),
    ).toBe(true);
    expect(
      result.weapons.some(
        (weapon) => weapon.name === "Self Bow" && weapon.range === "80",
      ),
    ).toBe(true);
    expect(
      result.magic.some(
        (spell) =>
          spell.name === "Analyze Magic" &&
          spell.points === 1 &&
          spell.source.includes("Lankhor Mhy Spells"),
      ),
    ).toBe(true);
    expect(result.trailingNotes?.includes("Ornstal had a auspicion birth.")).toBe(
      true,
    );
  });
});
