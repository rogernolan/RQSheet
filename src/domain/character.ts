import type { Character, HitLocation, HitLocationKey } from "@/domain/types";
import { normalizeEquipment } from "@/domain/equipment";
import { normalizeSkills } from "@/domain/skills";
import type { ParsedPassionEntry } from "@/domain/import/types";
import { normalizeWeapons } from "@/domain/weapons";

type StatisticKey = "str" | "con" | "siz" | "dex" | "int" | "pow" | "cha";

interface StatisticStripEntry {
  key: StatisticKey;
  label: string;
  value: number;
}

const defaultCharacter: Character = {
  id: "",
  name: "",
  worships: "",
  family: "",
  patron: "",
  occupation: "",
  notes: "",
  runePercentages: {},
  runeExperienceChecks: {},
  passions: [],
  skills: [],
  weapons: [],
  equipment: [],
  magic: [],
  hitLocations: [],
  str: 10,
  con: 10,
  siz: 10,
  dex: 10,
  int: 10,
  pow: 10,
  powExperienceCheck: false,
  cha: 10,
  currentMagicPoints: 10,
  runePoints: 3,
  createdAt: "",
  updatedAt: "",
};

export function createCharacter(seed: Partial<Character> = {}): Character {
  const now = new Date().toISOString();
  const pow = Math.max(0, seed.pow ?? defaultCharacter.pow);
  const currentMagicPoints = Math.min(
    Math.max(0, seed.currentMagicPoints ?? pow),
    pow,
  );

  const character = {
    ...defaultCharacter,
    ...seed,
    passions: normalizePassions(seed.passions),
    equipment: normalizeEquipment(seed.equipment),
    skills: normalizeSkills(seed.skills),
    weapons: normalizeWeapons(seed.weapons),
    pow,
    currentMagicPoints,
    id: seed.id ?? createId(),
    createdAt: seed.createdAt ?? now,
    updatedAt: seed.updatedAt ?? now,
  };

  return {
    ...character,
    hitLocations: reconcileHitLocations(character, seed.hitLocations),
  };
}

export function normalizePassions(
  passions: ParsedPassionEntry[] | undefined,
): ParsedPassionEntry[] {
  return (passions ?? []).map((passion) => ({
    ...passion,
    experienceCheck: passion.experienceCheck ?? false,
  }));
}

export function getDisplayName(character: Character): string {
  const trimmedName = character.name.trim();
  return trimmedName.length > 0 ? trimmedName : "Unnamed Character";
}

export function getMaxMagicPoints(character: Character): number {
  return Math.max(0, character.pow);
}

export function clampCurrentMagicPoints(
  character: Character,
  currentMagicPoints: number,
): number {
  return Math.min(Math.max(0, currentMagicPoints), getMaxMagicPoints(character));
}

export function getDamageBonusText(character: Character): string {
  const total = character.str + character.siz;

  if (total <= 12) {
    return "-1D4";
  }

  if (total <= 24) {
    return "-";
  }

  if (total <= 32) {
    return "+1D4";
  }

  if (total <= 40) {
    return "+1D6";
  }

  if (total <= 56) {
    return "+2D6";
  }

  return `+${3 + Math.floor((total - 57) / 16)}D6`;
}

export function getStatisticStripEntries(
  character: Character,
): StatisticStripEntry[] {
  return [
    { key: "str", label: "STR", value: character.str },
    { key: "con", label: "CON", value: character.con },
    { key: "siz", label: "SIZ", value: character.siz },
    { key: "dex", label: "DEX", value: character.dex },
    { key: "int", label: "INT", value: character.int },
    { key: "pow", label: "POW", value: character.pow },
    { key: "cha", label: "CHA", value: character.cha },
  ];
}

export function getMaxHitPoints(character: Character): number {
  return Math.max(
    1,
    character.con +
      hitPointModifier(character.siz, "siz") +
      hitPointModifier(character.pow, "pow"),
  );
}

export function createHitLocations(character: Character): HitLocation[] {
  const totalHitPoints = getMaxHitPoints(character);
  const template = hitLocationTemplate(totalHitPoints);

  return [
    buildHitLocation("head", "Head", "19-20", template.head),
    buildHitLocation("chest", "Chest", "12", template.chest),
    buildHitLocation("abdomen", "Abdomen", "09-11", template.abdomen),
    buildHitLocation("leftArm", "Left Arm", "16-18", template.arm),
    buildHitLocation("rightArm", "Right Arm", "13-15", template.arm),
    buildHitLocation("leftLeg", "Left Leg", "05-08", template.leg),
    buildHitLocation("rightLeg", "Right Leg", "01-04", template.leg),
  ];
}

export function reconcileHitLocations(
  character: Character,
  existingLocations: HitLocation[] = [],
): HitLocation[] {
  const generatedLocations = createHitLocations(character);
  const existingByKey = new Map(
    existingLocations.map((location) => [location.key, location]),
  );

  return generatedLocations.map((generatedLocation) => {
    const existingLocation = existingByKey.get(generatedLocation.key);

    if (!existingLocation) {
      return generatedLocation;
    }

    return {
      ...generatedLocation,
      armour: Math.max(0, existingLocation.armour),
      currentHP: clampHitLocationCurrentHP(
        existingLocation.currentHP,
        generatedLocation.maxHP,
      ),
    };
  });
}

function buildHitLocation(
  key: HitLocationKey,
  label: string,
  range: string,
  maxHP: number,
): HitLocation {
  return {
    key,
    label,
    range,
    maxHP,
    currentHP: maxHP,
    armour: 0,
  };
}

function clampHitLocationCurrentHP(currentHP: number, maxHP: number): number {
  return Math.min(Math.max(0, currentHP), maxHP);
}

function hitPointModifier(
  value: number,
  characteristic: "siz" | "pow",
): number {
  if (characteristic === "siz") {
    if (value <= 4) return -2;
    if (value <= 8) return -1;
    if (value <= 12) return 0;
    if (value <= 16) return 1;
    if (value <= 20) return 2;
    if (value <= 24) return 3;
    if (value <= 28) return 4;
    return 4 + Math.floor((value - 25) / 4);
  }

  if (value <= 4) return -1;
  if (value <= 16) return 0;
  if (value <= 20) return 1;
  if (value <= 24) return 2;
  if (value <= 28) return 3;
  return 3 + Math.floor((value - 25) / 4);
}

function hitLocationTemplate(totalHitPoints: number) {
  const total = Math.max(1, totalHitPoints);
  if (total <= 6) {
    return { leg: 2, abdomen: 2, chest: 3, arm: 1, head: 2 };
  }
  if (total <= 9) {
    return { leg: 3, abdomen: 3, chest: 4, arm: 2, head: 3 };
  }
  if (total <= 12) {
    return { leg: 4, abdomen: 4, chest: 5, arm: 3, head: 4 };
  }
  if (total <= 15) {
    return { leg: 5, abdomen: 5, chest: 6, arm: 4, head: 5 };
  }
  if (total <= 18) {
    return { leg: 6, abdomen: 6, chest: 7, arm: 5, head: 6 };
  }

  const bonus = Math.max(0, Math.floor((total - 19) / 3));
  return {
    leg: 7 + bonus,
    abdomen: 7 + bonus,
    chest: 8 + bonus,
    arm: 6 + bonus,
    head: 7 + bonus,
  };
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `character-${Math.random().toString(36).slice(2, 10)}`;
}
