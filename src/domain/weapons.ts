import type { ParsedWeaponEntry } from "@/domain/import/types";
import type {
  CharacterWeaponRecord,
  CharacterWeaponType,
} from "@/domain/types";

function normalizeWeaponType(value: string | undefined): CharacterWeaponType {
  switch ((value ?? "").trim().toLowerCase()) {
    case "c":
      return "c";
    case "s":
      return "s";
    case "i":
      return "i";
    case "cnt":
      return "cnt";
    default:
      return "";
  }
}

export function getWeaponTypeLabel(value: CharacterWeaponType): string {
  switch (value) {
    case "c":
      return "Crush";
    case "s":
      return "Slash";
    case "i":
      return "Impale";
    case "cnt":
      return "Cut/Thrust";
    default:
      return "-";
  }
}

function clampPercentage(value: number | undefined): number {
  return Math.min(500, Math.max(0, value ?? 0));
}

function normalizeOptionalPositive(value: number | undefined): number | undefined {
  if (typeof value !== "number" || Number.isFinite(value) === false) {
    return undefined;
  }

  return value > 0 ? Math.floor(value) : undefined;
}

export function normalizeWeapons(
  weapons: CharacterWeaponRecord[] | undefined,
): CharacterWeaponRecord[] {
  return (weapons ?? []).map((weapon) => ({
    name: weapon.name ?? "",
    percentage: clampPercentage(weapon.percentage),
    experienceCheck: weapon.experienceCheck ?? false,
    damage: weapon.damage ?? "",
    strikeRank: weapon.strikeRank ?? "",
    range: weapon.range ?? "",
    hpCurrent: normalizeOptionalPositive(weapon.hpCurrent),
    hpMax: normalizeOptionalPositive(weapon.hpMax),
    enc: normalizeOptionalPositive(weapon.enc),
    type: normalizeWeaponType(weapon.type),
    isEquipped: weapon.isEquipped ?? false,
  }));
}

export function createImportedWeapons(
  weapons: ParsedWeaponEntry[],
): CharacterWeaponRecord[] {
  return normalizeWeapons(
    weapons.map((weapon) => ({
      name: weapon.name,
      percentage: weapon.percentage ?? 0,
      experienceCheck: false,
      damage: weapon.damage ?? "",
      strikeRank: weapon.strikeRank ?? "",
      range: weapon.range ?? "",
      type: "",
      isEquipped: false,
    })),
  );
}
