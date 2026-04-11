import { describe, expect, it } from "vitest";

import {
  formatGloranthanDate,
  getWeeksForSeason,
  parseGloranthanDate,
} from "@/domain/glorantha-date";

describe("gloranthan date helpers", () => {
  it("returns sacred time week names only for Sacred Time", () => {
    expect(getWeeksForSeason("Sacred Time")).toEqual(["Luck Week", "Fate Week"]);
    expect(getWeeksForSeason("Sea Season")).toEqual([
      "Disorder Week",
      "Harmony Week",
      "Death Week",
      "Fertility Week",
      "Stasis Week",
      "Movement Week",
      "Illusion Week",
      "Truth Week",
    ]);
  });

  it("parses a formatted gloranthan birth date", () => {
    expect(
      parseGloranthanDate("Windsday, Movement Week, Storm Season, 1604"),
    ).toEqual({
      day: "Windsday",
      week: "Movement Week",
      season: "Storm Season",
      year: "1604",
    });
  });

  it("formats a structured gloranthan birth date", () => {
    expect(
      formatGloranthanDate({
        day: "Clayday",
        week: "Fertility Week",
        season: "Earth Season",
        year: "1606",
      }),
    ).toBe("Clayday, Fertility Week, Earth Season, 1606");
  });
});
