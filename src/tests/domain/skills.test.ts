import { describe, expect, it } from "vitest";

import { createCharacter } from "@/domain/character";
import type { ParsedSkillEntry } from "@/domain/import/types";
import {
  createImportedSkills,
  createDefaultSkills,
  getGroupedSkills,
  getSkillEffectiveValue,
  normalizeSkills,
} from "@/domain/skills";

describe("skills domain helpers", () => {
  it("seeds the default skill catalog from the iOS source data", () => {
    const skills = createDefaultSkills();

    expect(skills.length).toBeGreaterThan(40);
    expect(skills.some((skill) => skill.group === "agility" && skill.name === "Dodge")).toBe(true);
    expect(skills.some((skill) => skill.group === "magic" && skill.name === "Spirit Combat")).toBe(true);
    expect(skills.some((skill) => skill.name === "Melee Weapon")).toBe(false);
  });

  it("calculates effective skill percentages from base rules and group bonuses", () => {
    const character = createCharacter({
      dex: 15,
      int: 17,
      pow: 17,
      skills: createDefaultSkills(),
    });
    const dodge = character.skills.find((skill) => skill.name === "Dodge");
    const firstAid = character.skills.find((skill) => skill.name === "First Aid");

    expect(dodge).toBeTruthy();
    expect(firstAid).toBeTruthy();
    expect(getSkillEffectiveValue(character, dodge!)).toBe(35);
    expect(getSkillEffectiveValue(character, firstAid!)).toBe(25);
  });

  it("treats imported skills as authoritative over defaults", () => {
    const importedSkills: ParsedSkillEntry[] = [
      { name: "Dodge", groupName: "agility", percentage: 55, isCustom: false },
      { name: "Moon Lore", groupName: "knowledge", percentage: 25, isCustom: true },
    ];
    const baseCharacter = createCharacter({
      dex: 15,
      int: 17,
      pow: 17,
    });

    const skills = createImportedSkills(importedSkills, baseCharacter);
    const character = createCharacter({ ...baseCharacter, skills });

    const dodge = character.skills.find((skill) => skill.name === "Dodge");
    const moonLore = character.skills.find((skill) => skill.name === "Moon Lore");

    expect(character.skills).toHaveLength(2);
    expect(dodge).toBeTruthy();
    expect(getSkillEffectiveValue(character, dodge!)).toBe(55);
    expect(moonLore).toEqual({
      name: "Moon Lore",
      group: "knowledge",
      baseRule: "0",
      modifier: 10,
      isCustom: true,
      experienceCheck: false,
    });
  });

  it("groups and filters skills like the iOS view model", () => {
    const character = createCharacter({
      skills: createDefaultSkills(),
    });

    const grouped = getGroupedSkills(character, "spirit");

    expect(grouped.agility).toEqual([]);
    expect(grouped.magic.map((skill) => skill.name)).toContain("Spirit Combat");
    expect(grouped.magic.map((skill) => skill.name)).toContain("Spirit Dance");
  });

  it("normalizes stored skills that predate the experience check flag", () => {
    const skills = normalizeSkills([
      {
        name: "Dodge",
        group: "agility",
        baseRule: "DEXx2",
        modifier: 0,
        isCustom: false,
      } as never,
    ]);

    expect(skills[0]?.experienceCheck).toBe(false);
  });
});
