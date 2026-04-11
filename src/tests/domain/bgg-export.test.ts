import { describe, expect, it } from "vitest";

import { createCharacter } from "@/domain/character";
import { formatCharacterForBGG } from "@/domain/bgg-export";

describe("BGG character export", () => {
  it("formats a character into BGG-style monospace markup", () => {
    const character = createCharacter({
      name: "Ornstal the Quick",
      worships: "Lhankhor Mhy",
      family: "Lorionaeo",
      patron: "Marele",
      occupation: "Scribe",
      notes: "Fastest runner in Nochet.",
      runePercentages: {
        air: 75,
        fire: 60,
        truth: 80,
        illusion: 20,
      },
      runeExperienceChecks: {
        air: true,
        truth: true,
      },
      passions: [
        { name: "Loyalty (Sartar)", percentage: 60, experienceCheck: true },
        { name: "Love (family)", percentage: 75, experienceCheck: false },
      ],
      skills: [
        {
          name: "Dodge",
          group: "agility",
          baseRule: "DEXx2",
          modifier: 0,
          isCustom: false,
          experienceCheck: true,
        },
      ],
      weapons: [
        {
          name: "Rapier",
          percentage: 45,
          experienceCheck: true,
          damage: "1d6+1",
          strikeRank: "2",
          range: "",
          hpCurrent: 8,
          hpMax: 12,
          enc: 1,
          type: "i",
          isEquipped: true,
        },
      ],
      magic: [
        { name: "Detect Magic", points: 1, source: "Spells in Mind (pts)", page: "14" },
        { name: "Sword Trance", points: 2, source: "Lhankhor Mhy Spells (RPs)", page: "88" },
      ],
      str: 12,
      con: 14,
      siz: 16,
      dex: 15,
      int: 17,
      pow: 13,
      powExperienceCheck: true,
      cha: 11,
      currentMagicPoints: 9,
      runePoints: 3,
    });

    const text = formatCharacterForBGG(character);

    expect(text).toContain("Name: [u]Ornstal the Quick[/u]");
    expect(text).toContain("Cult: [u]Initiate of Lhankhor Mhy[/u]");
    expect(text).toContain("POW: 13 [x]");
    expect(text).toContain("Air:");
    expect(text).toContain("75 [x]");
    expect(text).toContain("Truth | Illusion");
    expect(text).toContain("Loyalty (Sartar)");
    expect(text).toContain("60% [x]");
    expect(text).toContain("Weapon           SR    Hit%");
    expect(text).toContain("Rapier");
    expect(text).toContain("45% [x]");
    expect(text).toContain("[u][b]Agility[/b][/u]");
    expect(text).toContain("Dodge");
    expect(text).toContain("[u][b]Rune Magic");
    expect(text).toContain("Sword Trance");
    expect(text).toContain("[u][b]Spirit Magic");
    expect(text).toContain("Detect Magic");
    expect(text).toContain("Current MPs:  09");
  });
});
