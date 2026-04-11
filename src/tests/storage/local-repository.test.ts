import { describe, expect, it } from "vitest";

import type { Character } from "@/domain/types";
import {
  createCharacterRepository,
  createMemoryCharacterStore,
} from "@/lib/storage";

describe("local character repository", () => {
  it("creates and lists a new character with defaults merged from a seed", async () => {
    const repository = createCharacterRepository(createMemoryCharacterStore());

    const created = await repository.createCharacter({
      name: "Arkat",
      pow: 18,
      powExperienceCheck: true,
    });
    const characters = await repository.listCharacters();

    expect(created.id).toBeTruthy();
    expect(created.name).toBe("Arkat");
    expect(created.pow).toBe(18);
    expect(created.powExperienceCheck).toBe(true);
    expect(created.tribe).toBe("");
    expect(created.reputation).toBe(0);
    expect(created.sol).toBe("");
    expect(created.income).toBe("");
    expect(created.ransom).toBe(1000);
    expect(created.gifts).toEqual([]);
    expect(created.geases).toEqual([]);
    expect(created.skills.length).toBeGreaterThan(40);
    expect(characters).toHaveLength(1);
    expect(characters[0].id).toBe(created.id);
  });

  it("saves updates to an existing character", async () => {
    const repository = createCharacterRepository(createMemoryCharacterStore());

    const created = await repository.createCharacter({ name: "Arkat" });
    await repository.saveCharacter({
      ...created,
      name: "Arkat the Wise",
      skills: created.skills.map((skill) =>
        skill.name === "Dodge" ? { ...skill, experienceCheck: true } : skill,
      ),
    });

    const saved = await repository.getCharacter(created.id);

    expect(saved?.name).toBe("Arkat the Wise");
    expect(saved?.skills.find((skill) => skill.name === "Dodge")?.experienceCheck).toBe(true);
  });

  it("persists edited passion experience checks", async () => {
    const repository = createCharacterRepository(createMemoryCharacterStore());

    const created = await repository.createCharacter({
      name: "Arkat",
      passions: [{ name: "Loyalty (Sartar)", percentage: 60 }],
    });

    await repository.saveCharacter({
      ...created,
      passions: created.passions.map((passion) => ({
        ...passion,
        experienceCheck: passion.name === "Loyalty (Sartar)",
      })),
    });

    const saved = await repository.getCharacter(created.id);

    expect(saved?.passions[0]?.experienceCheck).toBe(true);
  });

  it("persists edited hit locations and refreshes max HP from current stats", async () => {
    const repository = createCharacterRepository(createMemoryCharacterStore());

    const created = await repository.createCharacter({
      name: "Arkat",
      con: 14,
      siz: 16,
      pow: 17,
    });

    const updatedHead = created.hitLocations.map((location) =>
      location.key === "head"
        ? { ...location, armour: 4, currentHP: 3 }
        : location,
    );

    await repository.saveCharacter({
      ...created,
      con: 10,
      siz: 10,
      pow: 10,
      hitLocations: updatedHead,
    });

    const saved = await repository.getCharacter(created.id);
    const head = saved?.hitLocations.find((location) => location.key === "head");

    expect(head).toEqual({
      key: "head",
      label: "Head",
      range: "19-20",
      maxHP: 4,
      currentHP: 3,
      armour: 4,
    });
  });

  it("clamps current magic points when saved POW is lowered", async () => {
    const repository = createCharacterRepository(createMemoryCharacterStore());

    const created = await repository.createCharacter({
      name: "Arkat",
      pow: 18,
      currentMagicPoints: 18,
    });

    await repository.saveCharacter({
      ...created,
      pow: 12,
      currentMagicPoints: 18,
    });

    const saved = await repository.getCharacter(created.id);

    expect(saved?.pow).toBe(12);
    expect(saved?.currentMagicPoints).toBe(12);
  });

  it("deletes a character", async () => {
    const repository = createCharacterRepository(createMemoryCharacterStore());

    const created = await repository.createCharacter({ name: "Arkat" });
    await repository.deleteCharacter(created.id);

    const characters = await repository.listCharacters();

    expect(characters).toEqual([]);
  });

  it("imports a character from parsed text", async () => {
    const repository = createCharacterRepository(createMemoryCharacterStore());

    const imported = await repository.importCharacter({
      rawText: "",
      characterName: "Selina",
      characterInfo: {
        candidateName: "Selina",
        family: "Lorionaeo",
        patron: "Marele",
        dateOfBirth: "Earth season, 1604",
        occupation: "Initiate",
        reputation: 25,
        sol: "Free",
        income: "40",
        ransom: 1200,
        cult: "Issaries",
        worships: ["Lanbril"],
      },
      attributes: {
        dex: 19,
        pow: 15,
      },
      runePercentages: {},
      passions: [],
      skills: [
        { name: "Dodge", groupName: "agility", percentage: 55, isCustom: false },
      ],
      weapons: [],
      equipment: [],
      magic: [],
      coverage: {
        foundIdentityFields: 0,
        expectedIdentityFields: 0,
        foundAttributes: 0,
        expectedAttributes: 0,
        foundRunes: 0,
        expectedRunes: 0,
        foundSkills: 0,
        foundSkillGroups: 0,
        expectedSkillGroups: 0,
        unsupportedSkillGroups: 0,
        foundEquipmentEntries: 0,
        foundMagicEntries: 0,
        foundPassions: 0,
      },
    });

    expect(imported.name).toBe("Selina");
    expect(imported.family).toBe("Lorionaeo");
    expect(imported.worships).toBe("Issaries, Lanbril");
    expect(imported.dateOfBirth).toBe("Earth season, 1604");
    expect(imported.reputation).toBe(25);
    expect(imported.sol).toBe("Free");
    expect(imported.income).toBe("40");
    expect(imported.ransom).toBe(1200);
    expect(imported.dex).toBe(19);
    expect(imported.skills.some((skill) => skill.name === "Dodge")).toBe(true);
    expect(imported.skills.some((skill) => skill.name === "Boat")).toBe(false);
    expect((await repository.listCharacters())).toHaveLength(1);
  });

  it("persists imported passions, weapons, equipment, magic, and runes", async () => {
    const repository = createCharacterRepository(createMemoryCharacterStore());

    const imported = await repository.importCharacter({
      rawText: "",
      characterName: "Ornstal the Quick",
      characterInfo: {
        candidateName: "Ornstal the Quick",
        family: "Lorionaeo",
        patron: "Marele",
        worships: [],
        honor: 60,
      },
      attributes: {
        str: 12,
        pow: 17,
      },
      runePercentages: {
        truth: 75,
        illusion: 25,
      },
      passions: [
        { name: "Love (family)", percentage: 60 },
        { name: "Hate (House Vralaeo)", percentage: 60 },
      ],
      skills: [
        { name: "Spirit Combat", groupName: "magic", percentage: 35, isCustom: false },
      ],
      weapons: [
        { name: "Rapier", percentage: 30, damage: "1d6+1" },
        { name: "Self Bow", percentage: 50, range: "80" },
      ],
      equipment: [
        "Writing implements and materials (with small wooden carrying case)",
      ],
      magic: [
        { name: "Analyze Magic", points: 1, source: "Lankhor Mhy Spells" },
      ],
      trailingNotes: "Ornstal had a auspicion birth.",
      coverage: {
        foundIdentityFields: 0,
        expectedIdentityFields: 0,
        foundAttributes: 0,
        expectedAttributes: 0,
        foundRunes: 0,
        expectedRunes: 0,
        foundSkills: 0,
        foundSkillGroups: 0,
        expectedSkillGroups: 0,
        unsupportedSkillGroups: 0,
        foundEquipmentEntries: 0,
        foundMagicEntries: 0,
        foundPassions: 0,
      },
    });

    expect(imported.runePercentages.truth).toBe(75);
    expect(imported.passions).toHaveLength(2);
    expect(imported.passions[0]?.experienceCheck).toBe(false);
    expect(imported.weapons[0]?.name).toBe("Rapier");
    expect(imported.equipment[0]?.name).toContain("Writing implements");
    expect(imported.equipment[0]?.enc).toBe(0);
    expect(imported.equipment[0]?.isEquipped).toBe(false);
    expect(imported.magic[0]?.name).toBe("Analyze Magic");
    expect(imported.notes).toContain("auspicion birth");
    expect(imported.skills.some((skill) => skill.name === "Spirit Combat")).toBe(true);
    expect(imported.skills.some((skill) => skill.name === "Dodge")).toBe(false);
  });

  it("normalizes older stored characters that are missing newer collection fields", async () => {
    const legacyCharacter = {
      id: "legacy-1",
      name: "Legacy Character",
      worships: "",
      family: "",
      patron: "",
      occupation: "",
      notes: "",
      str: 10,
      con: 10,
      siz: 10,
      dex: 10,
      int: 10,
      pow: 10,
      cha: 10,
      currentMagicPoints: 10,
      createdAt: "2026-04-04T00:00:00.000Z",
      updatedAt: "2026-04-04T00:00:00.000Z",
    } as Character;

    const repository = createCharacterRepository(
      createMemoryCharacterStore([legacyCharacter]),
    );

    const loaded = await repository.getCharacter("legacy-1");

    expect(loaded?.weapons).toEqual([]);
    expect(loaded?.equipment).toEqual([]);
    expect(loaded?.magic).toEqual([]);
    expect(loaded?.passions).toEqual([]);
    expect(loaded?.runePercentages).toEqual({});
    expect(loaded?.skills.length).toBeGreaterThan(40);
  });
});
