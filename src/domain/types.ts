import type {
  ParsedPassionEntry,
  ParsedSpellEntry,
  SkillGroupName,
  RuneName,
} from "@/domain/import/types";

export interface CharacterSkillRecord {
  name: string;
  group: SkillGroupName;
  baseRule: string;
  modifier: number;
  isCustom: boolean;
  experienceCheck: boolean;
}

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

export type CharacterWeaponType = "c" | "s" | "i" | "cnt" | "";

export interface CharacterWeaponRecord {
  name: string;
  percentage: number;
  experienceCheck: boolean;
  damage: string;
  strikeRank: string;
  range: string;
  hpCurrent?: number;
  hpMax?: number;
  enc?: number;
  type: CharacterWeaponType;
  isEquipped: boolean;
}

export interface CharacterEquipmentRecord {
  name: string;
  enc: number;
  isEquipped: boolean;
}

export interface Character {
  id: string;
  name: string;
  portraitDataUrl: string;
  worships: string;
  tribe: string;
  family: string;
  patron: string;
  dateOfBirth: string;
  birthDay: string;
  birthWeek: string;
  birthSeason: string;
  birthYear: string;
  occupation: string;
  reputation: number;
  sol: string;
  income: string;
  ransom: number;
  gifts: string[];
  geases: string[];
  notes: string;
  runePercentages: Partial<Record<RuneName, number>>;
  runeExperienceChecks: Partial<Record<RuneName, boolean>>;
  passions: ParsedPassionEntry[];
  skills: CharacterSkillRecord[];
  weapons: CharacterWeaponRecord[];
  equipment: CharacterEquipmentRecord[];
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
  runePoints: number;
  updatedAt: string;
  createdAt: string;
}
