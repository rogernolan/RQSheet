import { describe, expect, it } from "vitest";

import { classifySpellSource } from "@/domain/magic";

describe("magic source classification", () => {
  it("treats spells in mind as spirit magic", () => {
    expect(classifySpellSource("Spells in Mind (pts)")).toBe("spirit");
  });

  it("treats matrix spells as spirit magic", () => {
    expect(classifySpellSource("Matrix Spells (pts)")).toBe("spirit");
  });

  it("treats cult rune spell headings as rune magic", () => {
    expect(classifySpellSource("Lankhor Mhy Spells (RPs)")).toBe("rune");
  });
});

