import { describe, expect, it } from "vitest";

import type { CharacterRepository } from "@/lib/storage/types";

describe("CharacterRepository contract", () => {
  it("accepts a local-first repository shape", () => {
    const repository: CharacterRepository = {
      async listCharacters() {
        return [];
      },
      async getCharacter() {
        return null;
      },
      async createCharacter() {
        throw new Error("not implemented");
      },
      async saveCharacter() {
        throw new Error("not implemented");
      },
      async deleteCharacter() {
        return undefined;
      },
      async importCharacter() {
        throw new Error("not implemented");
      },
    };

    expect(repository).toBeDefined();
  });
});
