import { reconcileHitLocations } from "@/domain/character";
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
    family: seed.family ?? "",
    patron: seed.patron ?? "",
    occupation: seed.occupation ?? "",
    notes: seed.notes ?? "",
    runePercentages: seed.runePercentages ?? {},
    runeExperienceChecks: seed.runeExperienceChecks ?? {},
    passions: seed.passions ?? [],
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
