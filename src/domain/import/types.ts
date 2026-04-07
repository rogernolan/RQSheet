export type TextImportSectionKey =
  | "characterInfo"
  | "attributes"
  | "runes"
  | "skills"
  | "equipment"
  | "magic"
  | "passions";

export type CharacteristicKey =
  | "str"
  | "con"
  | "siz"
  | "dex"
  | "int"
  | "pow"
  | "cha";

export type RuneName =
  | "air"
  | "fire"
  | "darkness"
  | "water"
  | "earth"
  | "moon"
  | "man"
  | "beast"
  | "fertility"
  | "death"
  | "harmony"
  | "disorder"
  | "truth"
  | "illusion"
  | "stasis"
  | "movement";

export type SkillGroupName =
  | "agility"
  | "communication"
  | "knowledge"
  | "manipulation"
  | "magic"
  | "perception"
  | "stealth";

export type TextImportSectionStatus = "green" | "yellow" | "red";

export interface TextImportSectionReview {
  section: TextImportSectionKey;
  status: TextImportSectionStatus;
  detail: string;
}

export interface ParsedCharacterInfo {
  candidateName?: string;
  family?: string;
  patron?: string;
  originalHouse?: string;
  dateOfBirth?: string;
  occupation?: string;
  reputation?: number;
  sol?: string;
  income?: string;
  ransom?: number;
  cult?: string;
  worships: string[];
  honor?: number;
}

export interface ParsedPassionEntry {
  name: string;
  percentage: number;
  experienceCheck?: boolean;
}

export interface ParsedSkillEntry {
  name: string;
  groupName: SkillGroupName;
  percentage: number;
  isCustom: boolean;
}

export interface ParsedWeaponEntry {
  name: string;
  percentage?: number;
  damage?: string;
  strikeRank?: string;
  range?: string;
}

export interface ParsedSpellEntry {
  name: string;
  points: number;
  source: string;
  page?: string;
}

export interface TextImportCoverage {
  foundIdentityFields: number;
  expectedIdentityFields: number;
  foundAttributes: number;
  expectedAttributes: number;
  foundRunes: number;
  expectedRunes: number;
  foundSkills: number;
  foundSkillGroups: number;
  expectedSkillGroups: number;
  unsupportedSkillGroups: number;
  foundEquipmentEntries: number;
  foundMagicEntries: number;
  foundPassions: number;
}

export interface ImportResult {
  rawText?: string;
  characterName?: string;
  characterInfo: ParsedCharacterInfo;
  attributes: Partial<Record<CharacteristicKey, number>>;
  runePercentages: Partial<Record<RuneName, number>>;
  passions: ParsedPassionEntry[];
  skills: ParsedSkillEntry[];
  weapons: ParsedWeaponEntry[];
  equipment: string[];
  magic: ParsedSpellEntry[];
  trailingNotes?: string;
  coverage: TextImportCoverage;
}

export interface DetectedTextImportSections {
  sectionContents: Partial<Record<TextImportSectionKey, string>>;
  trailingNotes?: string;
}

export function createEmptyCoverage(): TextImportCoverage {
  return {
    foundIdentityFields: 0,
    expectedIdentityFields: 0,
    foundAttributes: 0,
    expectedAttributes: 0,
    foundRunes: 0,
    expectedRunes: 0,
    foundSkills: 0,
    foundSkillGroups: 0,
    expectedSkillGroups: 0,
    unsupportedSkillGroups: 0,
    foundEquipmentEntries: 0,
    foundMagicEntries: 0,
    foundPassions: 0,
  };
}

export function createEmptyImportResult(): ImportResult {
  return {
    characterInfo: {
      worships: [],
    },
    attributes: {},
    runePercentages: {},
    passions: [],
    skills: [],
    weapons: [],
    equipment: [],
    magic: [],
    coverage: createEmptyCoverage(),
  };
}

export function reviewImportResult(result: ImportResult): TextImportSectionReview[] {
  return [
    {
      section: "characterInfo",
      status:
        result.coverage.expectedIdentityFields === 0
          ? "red"
          : result.coverage.foundIdentityFields === 0
            ? "red"
            : result.coverage.foundIdentityFields >=
                result.coverage.expectedIdentityFields
              ? "green"
              : "yellow",
      detail: `${result.coverage.foundIdentityFields}/${result.coverage.expectedIdentityFields}`,
    },
    {
      section: "attributes",
      status:
        result.coverage.expectedAttributes > 0 &&
        result.coverage.foundAttributes >= result.coverage.expectedAttributes
          ? "green"
          : "red",
      detail: `${result.coverage.foundAttributes}/${result.coverage.expectedAttributes}`,
    },
    {
      section: "runes",
      status:
        result.coverage.expectedRunes > 0 &&
        result.coverage.foundRunes >= result.coverage.expectedRunes
          ? "green"
          : "red",
      detail: `${result.coverage.foundRunes}/${result.coverage.expectedRunes}`,
    },
    {
      section: "skills",
      status:
        result.coverage.unsupportedSkillGroups > 0 ||
        result.coverage.foundSkills === 0
          ? "red"
          : result.coverage.expectedSkillGroups > 0 &&
              result.coverage.foundSkillGroups < result.coverage.expectedSkillGroups
            ? "yellow"
            : "green",
      detail: `${result.coverage.foundSkills} skills`,
    },
    {
      section: "equipment",
      status: result.coverage.foundEquipmentEntries > 0 ? "green" : "yellow",
      detail: `${result.coverage.foundEquipmentEntries} entries`,
    },
    {
      section: "magic",
      status: result.coverage.foundMagicEntries > 0 ? "green" : "yellow",
      detail: `${result.coverage.foundMagicEntries} entries`,
    },
    {
      section: "passions",
      status: result.coverage.foundPassions > 0 ? "green" : "yellow",
      detail: `${result.coverage.foundPassions} entries`,
    },
  ];
}
