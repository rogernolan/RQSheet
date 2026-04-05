import { describe, expect, it } from "vitest";

import { detectTextImportSections } from "@/domain/import/section-detector";
import { parseTextImportSkills } from "@/domain/import/skills-parser";
import { loadTextImportFixture } from "@/tests/fixtures/text-import/loadFixture";

describe("text import skills parser", () => {
  it("parses grouped skills and flags custom variants from Ornstal", () => {
    const text = loadTextImportFixture("Ornstal");
    const sections = detectTextImportSections(text);

    const result = parseTextImportSkills(sections);

    expect(
      result.skills.some(
        (skill) =>
          skill.name === "Boat" &&
          skill.groupName === "agility" &&
          skill.percentage === 10 &&
          !skill.isCustom,
      ),
    ).toBe(true);
    expect(
      result.skills.some(
        (skill) =>
          skill.name === "Ride high llama" &&
          skill.groupName === "agility" &&
          skill.percentage === 10 &&
          skill.isCustom,
      ),
    ).toBe(true);
    expect(result.coverage.foundSkillGroups).toBe(7);
    expect(result.coverage.expectedSkillGroups).toBe(7);
    expect(result.coverage.unsupportedSkillGroups).toBe(0);
  });
});
