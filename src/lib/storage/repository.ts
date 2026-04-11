import { createImportedEquipment } from "@/domain/equipment";
import type { ImportResult } from "@/domain/import/types";
import { createImportedSkills } from "@/domain/skills";
import { createImportedWeapons } from "@/domain/weapons";
import type { Character } from "@/domain/types";

import { createBlankCharacter } from "./default-character";
import type { CharacterRecordStore } from "./record-store";
import type { CharacterRepository } from "./types";

function normalizeCharacter(character: Character): Character {
  return createBlankCharacter(character);
}

function normalizeCharacters(characters: Character[]): Character[] {
  return characters.map(normalizeCharacter).sort((lhs, rhs) => {
    const nameCompare = lhs.name.localeCompare(rhs.name);
    return nameCompare !== 0 ? nameCompare : lhs.id.localeCompare(rhs.id);
  });
}

function ensureCharacterId(character: Character): Character {
  if (character.id.trim().length === 0) {
    throw new Error("Character id is required.");
  }

  return character;
}

function touchCharacter(character: Character): Character {
  const normalized = normalizeCharacter(character);
  const updatedAt = new Date().toISOString();
  const currentMagicPoints = Math.min(
    Math.max(0, normalized.currentMagicPoints),
    Math.max(0, normalized.pow),
  );
  const runePoints = Math.max(0, normalized.runePoints);

  return {
    ...normalized,
    currentMagicPoints,
    runePoints,
    updatedAt,
  };
}

export function createCharacterRepository(
  store: CharacterRecordStore,
): CharacterRepository {
  return {
    async listCharacters() {
      return normalizeCharacters(await store.listCharacters());
    },

    async getCharacter(id: string) {
      const character = await store.getCharacter(id);
      return character ? normalizeCharacter(character) : null;
    },

    async createCharacter(seed: Partial<Character> = {}) {
      const character = createBlankCharacter(seed);
      await store.putCharacter(character);
      return character;
    },

    async saveCharacter(character: Character) {
      await store.putCharacter(touchCharacter(ensureCharacterId(character)));
    },

    async deleteCharacter(id: string) {
      await store.deleteCharacter(id);
    },

    async importCharacter(result: ImportResult, nameOverride?: string) {
      const name =
        nameOverride?.trim() || result.characterInfo.candidateName?.trim() || "";
      const worships = [result.characterInfo.cult, ...result.characterInfo.worships]
        .filter(Boolean)
        .join(", ");
      const character = createBlankCharacter({
        name,
        worships,
        tribe: result.characterInfo.originalHouse ?? "",
        family: result.characterInfo.family ?? "",
        patron: result.characterInfo.patron ?? "",
        dateOfBirth: result.characterInfo.dateOfBirth ?? "",
        birthDay: "",
        birthWeek: "",
        birthSeason: "",
        birthYear: "",
        occupation: result.characterInfo.occupation ?? "",
        reputation: result.characterInfo.reputation ?? 0,
        sol: result.characterInfo.sol ?? "",
        income: result.characterInfo.income ?? "",
        ransom: result.characterInfo.ransom ?? 1000,
        notes: result.trailingNotes ?? "",
        runePercentages: result.runePercentages,
        runeExperienceChecks: {},
        passions: result.passions.map((passion) => ({
          ...passion,
          experienceCheck: passion.experienceCheck ?? false,
        })),
        skills: [],
        weapons: createImportedWeapons(result.weapons),
        equipment: createImportedEquipment(result.equipment),
        magic: result.magic,
        str: result.attributes.str,
        con: result.attributes.con,
        siz: result.attributes.siz,
        dex: result.attributes.dex,
        int: result.attributes.int,
        pow: result.attributes.pow,
        cha: result.attributes.cha,
      });
      character.skills = createImportedSkills(result.skills, character);
      await store.putCharacter(character);
      return character;
    },
  };
}
