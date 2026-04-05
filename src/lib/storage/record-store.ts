import type { Character } from "@/domain/types";

export interface CharacterRecordStore {
  listCharacters(): Promise<Character[]>;
  getCharacter(id: string): Promise<Character | null>;
  putCharacter(character: Character): Promise<void>;
  deleteCharacter(id: string): Promise<void>;
}
