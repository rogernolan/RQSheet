import { parseTextImportCore } from "@/domain/import/core-parser";
import { parseTextImportEquipmentAndMagic } from "@/domain/import/equipment-magic-parser";
import { quickParseImportText } from "@/domain/import/quick-parse";
import { detectTextImportSections } from "@/domain/import/section-detector";
import { parseTextImportSkills } from "@/domain/import/skills-parser";
import {
  createEmptyImportResult,
  type ImportResult,
} from "@/domain/import/types";

export function parseTextImport(rawText: string): ImportResult {
  const sections = detectTextImportSections(rawText);

  const combined = createEmptyImportResult();
  mergeImportResults(combined, parseTextImportCore(sections));
  mergeImportResults(combined, parseTextImportSkills(sections));
  mergeImportResults(combined, parseTextImportEquipmentAndMagic(sections));

  const quick = quickParseImportText(rawText);
  combined.rawText = quick.rawText;
  if (!combined.characterInfo.candidateName && quick.characterName) {
    combined.characterInfo.candidateName = quick.characterName;
  }
  combined.characterName = combined.characterInfo.candidateName;

  return combined;
}

function mergeImportResults(target: ImportResult, source: ImportResult) {
  if (hasCharacterInfo(source)) {
    target.characterInfo = source.characterInfo;
  }

  Object.assign(target.attributes, source.attributes);
  Object.assign(target.runePercentages, source.runePercentages);
  target.passions.push(...source.passions);
  target.skills.push(...source.skills);
  target.weapons.push(...source.weapons);
  target.equipment.push(...source.equipment);
  target.magic.push(...source.magic);
  target.trailingNotes = source.trailingNotes ?? target.trailingNotes;

  if (
    source.coverage.foundIdentityFields > 0 ||
    source.coverage.expectedIdentityFields > 0
  ) {
    target.coverage.foundIdentityFields = source.coverage.foundIdentityFields;
    target.coverage.expectedIdentityFields = source.coverage.expectedIdentityFields;
  }
  if (source.coverage.foundAttributes > 0 || source.coverage.expectedAttributes > 0) {
    target.coverage.foundAttributes = source.coverage.foundAttributes;
    target.coverage.expectedAttributes = source.coverage.expectedAttributes;
  }
  if (source.coverage.foundRunes > 0 || source.coverage.expectedRunes > 0) {
    target.coverage.foundRunes = source.coverage.foundRunes;
    target.coverage.expectedRunes = source.coverage.expectedRunes;
  }
  if (
    source.coverage.foundSkills > 0 ||
    source.coverage.expectedSkillGroups > 0 ||
    source.coverage.unsupportedSkillGroups > 0
  ) {
    target.coverage.foundSkills = source.coverage.foundSkills;
    target.coverage.foundSkillGroups = source.coverage.foundSkillGroups;
    target.coverage.expectedSkillGroups = source.coverage.expectedSkillGroups;
    target.coverage.unsupportedSkillGroups = source.coverage.unsupportedSkillGroups;
  }
  if (source.coverage.foundEquipmentEntries > 0) {
    target.coverage.foundEquipmentEntries = source.coverage.foundEquipmentEntries;
  }
  if (source.coverage.foundMagicEntries > 0) {
    target.coverage.foundMagicEntries = source.coverage.foundMagicEntries;
  }
  if (source.coverage.foundPassions > 0) {
    target.coverage.foundPassions = source.coverage.foundPassions;
  }
}

function hasCharacterInfo(source: ImportResult): boolean {
  const info = source.characterInfo;
  return Boolean(
    info.candidateName ||
      info.family ||
      info.patron ||
      info.originalHouse ||
      info.dateOfBirth ||
      info.occupation ||
      info.reputation !== undefined ||
      info.sol ||
      info.income ||
      info.ransom !== undefined ||
      info.cult ||
      info.worships.length > 0 ||
      info.honor !== undefined,
  );
}
