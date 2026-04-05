import { describe, expect, it } from "vitest";

import {
  clampCurrentMagicPoints,
  createCharacter,
  createHitLocations,
  getDamageBonusText,
  getDisplayName,
  getMaxMagicPoints,
  getMaxHitPoints,
  getStatisticStripEntries,
  reconcileHitLocations,
} from "@/domain/character";

describe("character domain helpers", () => {
  it("creates unique ids when none are provided", () => {
    const first = createCharacter();
    const second = createCharacter();

    expect(first.id.length).toBeGreaterThan(0);
    expect(second.id.length).toBeGreaterThan(0);
    expect(first.id).not.toBe(second.id);
  });

  it("falls back to Unnamed Character when name is blank", () => {
    const character = createCharacter({ name: "   " });

    expect(getDisplayName(character)).toBe("Unnamed Character");
  });

  it("uses POW as max magic points", () => {
    const character = createCharacter({ pow: 17 });

    expect(getMaxMagicPoints(character)).toBe(17);
  });

  it("clamps current magic points to the character max", () => {
    const character = createCharacter({ pow: 12 });

    expect(clampCurrentMagicPoints(character, 99)).toBe(12);
  });

  it("calculates damage bonus from STR plus SIZ", () => {
    const character = createCharacter({ str: 12, siz: 16 });

    expect(getDamageBonusText(character)).toBe("+1D4");
  });

  it("returns the statistics in sheet order", () => {
    const character = createCharacter({
      str: 12,
      con: 13,
      siz: 14,
      dex: 15,
      int: 16,
      pow: 17,
      cha: 18,
    });

    expect(getStatisticStripEntries(character)).toEqual([
      { key: "str", label: "STR", value: 12 },
      { key: "con", label: "CON", value: 13 },
      { key: "siz", label: "SIZ", value: 14 },
      { key: "dex", label: "DEX", value: 15 },
      { key: "int", label: "INT", value: 16 },
      { key: "pow", label: "POW", value: 17 },
      { key: "cha", label: "CHA", value: 18 },
    ]);
  });

  it("derives max hit points from CON, SIZ, and POW", () => {
    const character = createCharacter({
      con: 14,
      siz: 16,
      pow: 17,
    });

    expect(getMaxHitPoints(character)).toBe(16);
  });

  it("creates hit locations using the sheet-style distribution", () => {
    const character = createCharacter({
      con: 14,
      siz: 16,
      pow: 17,
    });

    const locations = createHitLocations(character);

    expect(locations).toEqual([
      { key: "head", label: "Head", range: "19-20", maxHP: 6, currentHP: 6, armour: 0 },
      { key: "chest", label: "Chest", range: "12", maxHP: 7, currentHP: 7, armour: 0 },
      { key: "abdomen", label: "Abdomen", range: "09-11", maxHP: 6, currentHP: 6, armour: 0 },
      { key: "leftArm", label: "Left Arm", range: "16-18", maxHP: 5, currentHP: 5, armour: 0 },
      { key: "rightArm", label: "Right Arm", range: "13-15", maxHP: 5, currentHP: 5, armour: 0 },
      { key: "leftLeg", label: "Left Leg", range: "05-08", maxHP: 6, currentHP: 6, armour: 0 },
      { key: "rightLeg", label: "Right Leg", range: "01-04", maxHP: 6, currentHP: 6, armour: 0 },
    ]);
  });

  it("preserves edited armour and current HP when reconciling hit locations", () => {
    const character = createCharacter({
      con: 14,
      siz: 16,
      pow: 17,
    });

    const locations = reconcileHitLocations(character, [
      { key: "head", label: "Head", range: "19-20", maxHP: 1, currentHP: 4, armour: 3 },
    ]);

    expect(locations.find((location) => location.key === "head")).toEqual({
      key: "head",
      label: "Head",
      range: "19-20",
      maxHP: 6,
      currentHP: 4,
      armour: 3,
    });
  });

  it("clamps edited current HP when reconciled max HP drops", () => {
    const character = createCharacter({
      con: 8,
      siz: 8,
      pow: 8,
    });

    const locations = reconcileHitLocations(character, [
      { key: "chest", label: "Chest", range: "12", maxHP: 99, currentHP: 12, armour: 2 },
    ]);

    expect(locations.find((location) => location.key === "chest")).toEqual({
      key: "chest",
      label: "Chest",
      range: "12",
      maxHP: 4,
      currentHP: 4,
      armour: 2,
    });
  });
});
