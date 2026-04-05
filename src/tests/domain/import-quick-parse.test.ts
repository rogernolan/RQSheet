import { describe, expect, it } from "vitest";

import { quickParseImportText } from "@/domain/import/quick-parse";

describe("quick import parsing", () => {
  it("uses the first non-empty line as the candidate character name", () => {
    const result = quickParseImportText("\n\nArkat the Bold\nHumakt initiate\n");

    expect(result.characterName).toBe("Arkat the Bold");
  });

  it("returns an empty result when the text is blank", () => {
    const result = quickParseImportText("   \n \n");

    expect(result.characterName).toBeUndefined();
  });
});
