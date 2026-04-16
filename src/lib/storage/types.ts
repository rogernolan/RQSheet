import type { ImportResult } from "@/domain/import/types";
import type { Character } from "@/domain/types";

export interface CharacterRepository {
  listCharacters(): Promise<Character[]>;
  getCharacter(id: string): Promise<Character | null>;
  createCharacter(seed?: Partial<Character>): Promise<Character>;
  saveCharacter(character: Character): Promise<Character>;
  deleteCharacter(id: string): Promise<void>;
  importCharacter(result: ImportResult, nameOverride?: string): Promise<Character>;
}
