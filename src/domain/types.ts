import type {
  ParsedPassionEntry,
  ParsedSpellEntry,
  ParsedWeaponEntry,
  RuneName,
} from "@/domain/import/types";

export type HitLocationKey =
  | "head"
  | "chest"
  | "abdomen"
  | "leftArm"
  | "rightArm"
  | "leftLeg"
  | "rightLeg";

export interface HitLocation {
  key: HitLocationKey;
  label: string;
  range: string;
  maxHP: number;
  currentHP: number;
  armour: number;
}

export interface Character {
  id: string;
  name: string;
  worships: string;
  family: string;
  patron: string;
  occupation: string;
  notes: string;
  runePercentages: Partial<Record<RuneName, number>>;
  passions: ParsedPassionEntry[];
  weapons: ParsedWeaponEntry[];
  equipment: string[];
  magic: ParsedSpellEntry[];
  hitLocations: HitLocation[];
  str: number;
  con: number;
  siz: number;
  dex: number;
  int: number;
  pow: number;
  powExperienceCheck: boolean;
  cha: number;
  currentMagicPoints: number;
  updatedAt: string;
  createdAt: string;
}
