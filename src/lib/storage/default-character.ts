import { normalizePassions, reconcileHitLocations } from "@/domain/character";
import { normalizeEquipment } from "@/domain/equipment";
import { normalizeSkills } from "@/domain/skills";
import { normalizeWeapons } from "@/domain/weapons";
import type { Character } from "@/domain/types";

export function createCharacterId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `character-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createBlankCharacter(seed: Partial<Character> = {}): Character {
  const now = new Date().toISOString();
  const pow = Math.max(0, seed.pow ?? 10);
  const currentMagicPoints = Math.min(
    Math.max(0, seed.currentMagicPoints ?? pow),
    pow,
  );

  const baseCharacter = {
    id: seed.id ?? createCharacterId(),
    name: seed.name ?? "",
    worships: seed.worships ?? "",
    tribe: seed.tribe ?? "",
    family: seed.family ?? "",
    patron: seed.patron ?? "",
    dateOfBirth: seed.dateOfBirth ?? "",
    birthDay: seed.birthDay ?? "",
    birthWeek: seed.birthWeek ?? "",
    birthSeason: seed.birthSeason ?? "",
    birthYear: seed.birthYear ?? "",
    occupation: seed.occupation ?? "",
    reputation: Math.max(0, Math.min(500, seed.reputation ?? 0)),
    sol: seed.sol ?? "",
    income: seed.income ?? "",
    ransom: Math.max(0, seed.ransom ?? 1000),
    gifts: seed.gifts ?? [],
    geases: seed.geases ?? [],
    notes: seed.notes ?? "",
    runePercentages: seed.runePercentages ?? {},
    runeExperienceChecks: seed.runeExperienceChecks ?? {},
    passions: normalizePassions(seed.passions),
    skills: normalizeSkills(seed.skills),
    weapons: normalizeWeapons(seed.weapons),
    equipment: normalizeEquipment(seed.equipment),
    magic: seed.magic ?? [],
    hitLocations: seed.hitLocations ?? [],
    str: seed.str ?? 10,
    con: seed.con ?? 10,
    siz: seed.siz ?? 10,
    dex: seed.dex ?? 10,
    int: seed.int ?? 10,
    pow,
    powExperienceCheck: seed.powExperienceCheck ?? false,
    cha: seed.cha ?? 10,
    currentMagicPoints,
    runePoints: Math.max(0, seed.runePoints ?? 3),
    createdAt: seed.createdAt ?? now,
    updatedAt: seed.updatedAt ?? now,
  } satisfies Character;

  return {
    ...baseCharacter,
    hitLocations: reconcileHitLocations(baseCharacter, seed.hitLocations),
  };
}
