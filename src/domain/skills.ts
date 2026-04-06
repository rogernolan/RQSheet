import sartarSkills from "@/domain/sartar-skills.json";
import type { ParsedSkillEntry, SkillGroupName } from "@/domain/import/types";
import type { Character, CharacterSkillRecord } from "@/domain/types";

type GroupedSkills = Record<SkillGroupName, CharacterSkillRecord[]>;

const groupOrder: SkillGroupName[] = [
  "agility",
  "communication",
  "knowledge",
  "manipulation",
  "magic",
  "perception",
  "stealth",
];

interface SkillSeedItem {
  name: string;
  base: string;
  subgroup?: string;
}

interface SkillSeedFile {
  skillGroups: Record<string, SkillSeedItem[]>;
}

const skillSeed = sartarSkills as SkillSeedFile;

export function createDefaultSkills(): CharacterSkillRecord[] {
  const defaults: CharacterSkillRecord[] = [];

  for (const group of groupOrder) {
    const groupSeeds = skillSeed.skillGroups[group] ?? [];

    for (const item of groupSeeds) {
      if (item.base.toLowerCase() === "base value") {
        continue;
      }

      const actualGroup =
        item.subgroup && isSkillGroupName(item.subgroup)
          ? item.subgroup
          : group;

      defaults.push({
        name: item.name,
        group: actualGroup,
        baseRule: item.base,
        modifier: 0,
        isCustom: false,
        experienceCheck: false,
      });
    }
  }

  return sortSkills(defaults);
}

export function normalizeSkills(
  skills: CharacterSkillRecord[] | undefined,
): CharacterSkillRecord[] {
  if (!skills || skills.length === 0) {
    return createDefaultSkills();
  }

  return sortSkills(
    skills.map((skill) => ({
      ...skill,
      experienceCheck: skill.experienceCheck ?? false,
    })),
  );
}

export function createImportedSkills(
  importedSkills: ParsedSkillEntry[],
  character: Character,
): CharacterSkillRecord[] {
  const defaultsByKey = new Map(
    createDefaultSkills().map((skill) => [skillKey(skill.group, skill.name), skill]),
  );

  return sortSkills(
    importedSkills.map((skill) => {
      const defaultSkill = defaultsByKey.get(skillKey(skill.groupName, skill.name));
      const baseRule = defaultSkill?.baseRule ?? "0";
      const baseValue =
        defaultSkill ? getSkillBaseValue(character, defaultSkill.baseRule) : 0;
      const groupBonus = getSkillGroupBonus(character, skill.groupName);

      return {
        name: skill.name,
        group: skill.groupName,
        baseRule,
        modifier: skill.percentage - (baseValue + groupBonus),
        isCustom: defaultSkill ? false : skill.isCustom,
        experienceCheck: false,
      };
    }),
  );
}

export function getGroupedSkills(
  character: Character,
  searchText = "",
): GroupedSkills {
  const query = searchText.trim().toLocaleLowerCase();
  const grouped = Object.fromEntries(
    groupOrder.map((group) => [group, [] as CharacterSkillRecord[]]),
  ) as GroupedSkills;

  for (const skill of sortSkills(character.skills)) {
    if (query.length > 0 && skill.name.toLocaleLowerCase().includes(query) === false) {
      continue;
    }

    grouped[skill.group].push(skill);
  }

  return grouped;
}

export function getSkillEffectiveValue(
  character: Character,
  skill: CharacterSkillRecord,
): number {
  return clampPercentage(
    getSkillBaseValue(character, skill.baseRule) +
      getSkillGroupBonus(character, skill.group) +
      skill.modifier,
  );
}

export function getSkillGroupTitle(group: SkillGroupName): string {
  switch (group) {
    case "agility":
      return "Agility";
    case "communication":
      return "Communication";
    case "knowledge":
      return "Knowledge";
    case "manipulation":
      return "Manipulation";
    case "magic":
      return "Magic";
    case "perception":
      return "Perception";
    case "stealth":
      return "Stealth";
  }
}

export function getSkillGroupOrder(): SkillGroupName[] {
  return groupOrder;
}

function sortSkills(skills: CharacterSkillRecord[]): CharacterSkillRecord[] {
  return [...skills].sort((lhs, rhs) => {
    const groupCompare = groupOrder.indexOf(lhs.group) - groupOrder.indexOf(rhs.group);
    if (groupCompare !== 0) {
      return groupCompare;
    }

    return lhs.name.localeCompare(rhs.name);
  });
}

function skillKey(group: SkillGroupName, name: string): string {
  return `${group}::${name.trim().toLocaleLowerCase()}`;
}

function isSkillGroupName(value: string): value is SkillGroupName {
  return groupOrder.includes(value as SkillGroupName);
}

function clampPercentage(value: number): number {
  return Math.min(500, Math.max(0, value));
}

export function getSkillBaseValue(
  character: Character,
  baseRule: string,
): number {
  const trimmed = baseRule.trim();
  const direct = Number.parseInt(trimmed, 10);
  if (Number.isNaN(direct) === false && /^[0-9]+$/.test(trimmed)) {
    return direct;
  }

  for (const attribute of ["STR", "CON", "SIZ", "DEX", "INT", "POW", "CHA"] as const) {
    const normalized = trimmed.toUpperCase().replaceAll(" ", "");
    if (normalized.startsWith(`${attribute}X`)) {
      const multiplier = Number.parseInt(normalized.slice(attribute.length + 1), 10);
      if (Number.isNaN(multiplier) === false) {
        return getCharacteristicValue(character, attribute) * multiplier;
      }
    }
  }

  const firstNumber = trimmed.match(/\d+/)?.[0];
  return firstNumber ? Number.parseInt(firstNumber, 10) : 0;
}

export function getSkillGroupBonus(
  character: Character,
  group: SkillGroupName,
): number {
  switch (group) {
    case "agility":
      return sumBonuses(
        statBonus(character.str, "STR"),
        statBonus(character.dex, "DEX"),
        statBonus(character.siz, "SIZ"),
      );
    case "communication":
      return sumBonuses(
        statBonus(character.int, "INT"),
        statBonus(character.pow, "POW"),
        statBonus(character.cha, "CHA"),
      );
    case "knowledge":
      return sumBonuses(statBonus(character.int, "INT"), statBonus(character.pow, "POW"));
    case "manipulation":
      return sumBonuses(
        statBonus(character.str, "STR"),
        statBonus(character.dex, "DEX"),
        statBonus(character.int, "INT"),
        statBonus(character.pow, "POW"),
      );
    case "magic":
      return 0;
    case "perception":
      return sumBonuses(statBonus(character.int, "INT"), statBonus(character.pow, "POW"));
    case "stealth":
      return sumBonuses(
        statBonus(character.siz, "SIZ"),
        statBonus(character.dex, "DEX"),
        statBonus(character.int, "INT"),
        statBonus(character.pow, "POW"),
      );
  }
}

function getCharacteristicValue(
  character: Character,
  attribute: "STR" | "CON" | "SIZ" | "DEX" | "INT" | "POW" | "CHA",
): number {
  switch (attribute) {
    case "STR":
      return character.str;
    case "CON":
      return character.con;
    case "SIZ":
      return character.siz;
    case "DEX":
      return character.dex;
    case "INT":
      return character.int;
    case "POW":
      return character.pow;
    case "CHA":
      return character.cha;
  }
}

function sumBonuses(...values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function statBonus(
  value: number,
  stat: "STR" | "SIZ" | "DEX" | "INT" | "POW" | "CHA",
): number {
  const base = (() => {
    switch (stat) {
      case "STR":
        switch (value) {
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
            return -10;
          case 5:
          case 6:
          case 7:
          case 8:
            return -5;
          case 9:
          case 10:
          case 11:
          case 12:
            return 0;
          case 13:
          case 14:
          case 15:
          case 16:
            return 5;
          default:
            return 10;
        }
      case "DEX":
      case "INT":
        switch (value) {
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
            return -10;
          case 5:
          case 6:
          case 7:
          case 8:
            return -5;
          case 9:
          case 10:
          case 11:
          case 12:
            return 0;
          case 13:
          case 14:
          case 15:
          case 16:
            return 5;
          default:
            return 10;
        }
      case "CHA":
        switch (value) {
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
            return -10;
          case 5:
          case 6:
          case 7:
          case 8:
            return -5;
          case 9:
          case 10:
          case 11:
          case 12:
            return 0;
          case 13:
          case 14:
          case 15:
          case 16:
            return 5;
          default:
            return 10;
        }
      case "POW":
        switch (value) {
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
            return -5;
          case 5:
          case 6:
          case 7:
          case 8:
          case 9:
          case 10:
          case 11:
          case 12:
          case 13:
          case 14:
          case 15:
          case 16:
            return 0;
          default:
            return 5;
        }
      case "SIZ":
        switch (value) {
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
            return 10;
          case 5:
          case 6:
          case 7:
          case 8:
            return 5;
          case 9:
          case 10:
          case 11:
          case 12:
            return 0;
          case 13:
          case 14:
          case 15:
          case 16:
            return -5;
          default:
            return -10;
        }
    }
  })();

  if (value < 21) {
    return base;
  }

  const steps = Math.floor((value - 21) / 4) + 1;

  switch (stat) {
    case "SIZ":
    case "POW":
      return base - steps * 5;
    case "STR":
    case "DEX":
    case "INT":
    case "CHA":
      return base + steps * 5;
  }
}
