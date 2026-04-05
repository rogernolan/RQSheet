import { describe, expect, it } from "vitest";

import { parseTextImport } from "@/domain/import/pipeline";
import { loadTextImportFixture } from "@/tests/helpers/text-import-fixture";

describe("text import pipeline", () => {
  it("combines parser slices for Ornstal", async () => {
    const text = await loadTextImportFixture("Ornstal");

    const result = parseTextImport(text);

    expect(result.characterInfo.candidateName).toBe("Ornstal the Quick");
    expect(result.attributes.pow).toBe(17);
    expect(result.runePercentages.truth).toBe(75);
    expect(
      result.skills.some(
        (skill) => skill.name === "Ride high llama" && skill.isCustom,
      ),
    ).toBe(true);
    expect(
      result.weapons.some(
        (weapon) => weapon.name === "Rapier" && weapon.percentage === 30,
      ),
    ).toBe(true);
    expect(
      result.magic.some(
        (spell) => spell.name === "Analyze Magic" && spell.points === 1,
      ),
    ).toBe(true);
    expect(result.trailingNotes).toContain("Ornstal had a auspicion birth.");
  });
});
