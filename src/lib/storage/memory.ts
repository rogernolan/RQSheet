import type { Character } from "@/domain/types";

import type { CharacterRecordStore } from "./record-store";

function cloneCharacter(character: Character): Character {
  return structuredClone(character);
}

export function createMemoryCharacterStore(
  initialCharacters: Character[] = [],
): CharacterRecordStore {
  const records = new Map(
    initialCharacters.map((character) => [character.id, cloneCharacter(character)]),
  );

  return {
    async listCharacters() {
      return Array.from(records.values()).map(cloneCharacter);
    },

    async getCharacter(id: string) {
      const character = records.get(id);
      return character ? cloneCharacter(character) : null;
    },

    async putCharacter(character: Character) {
      records.set(character.id, cloneCharacter(character));
    },

    async deleteCharacter(id: string) {
      records.delete(id);
    },
  };
}
