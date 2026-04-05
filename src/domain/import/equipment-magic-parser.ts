import {
  createEmptyImportResult,
  type DetectedTextImportSections,
  type ImportResult,
  type ParsedSpellEntry,
  type ParsedWeaponEntry,
} from "@/domain/import/types";
import { canonicalFieldText } from "@/domain/import/normalizer";

export function parseTextImportEquipmentAndMagic(
  sections: DetectedTextImportSections,
): ImportResult {
  const result = createEmptyImportResult();

  const equipmentText = sections.sectionContents.equipment;
  if (equipmentText) {
    const parsed = parseEquipmentSection(equipmentText);
    result.weapons = parsed.weapons;
    result.equipment = parsed.items;
  }
  result.coverage.foundEquipmentEntries =
    result.weapons.length + result.equipment.length;

  const magicText = sections.sectionContents.magic;
  if (magicText) {
    result.magic = parseMagicSection(magicText);
  }
  result.coverage.foundMagicEntries = result.magic.length;
  result.trailingNotes = sections.trailingNotes;

  return result;
}

export const parseEquipmentAndMagicImportSections =
  parseTextImportEquipmentAndMagic;

function parseEquipmentSection(section: string): {
  items: string[];
  weapons: ParsedWeaponEntry[];
} {
  const items: string[] = [];
  const weapons: ParsedWeaponEntry[] = [];
  let inWeaponTable = false;

  for (const line of section.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    if (isWeaponHeader(trimmed)) {
      inWeaponTable = true;
      continue;
    }

    if (trimmed.toLowerCase() === "equipment") {
      inWeaponTable = false;
      continue;
    }

    const weapon = parseWeaponLine(trimmed);
    if (weapon) {
      inWeaponTable = true;
      weapons.push(weapon);
      continue;
    }

    if (isCombatNoise(trimmed)) {
      continue;
    }

    if (!inWeaponTable || trimmed.toLowerCase().includes("armour points show")) {
      items.push(trimmed);
    }
  }

  return { items, weapons };
}

function parseMagicSection(section: string): ParsedSpellEntry[] {
  const spells: ParsedSpellEntry[] = [];
  let currentSource = "Magic";

  for (const line of section.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    const heading = spellHeading(trimmed);
    if (heading) {
      currentSource = heading;
      continue;
    }

    for (const match of trimmed.matchAll(/([A-Za-z0-9'’/ +:-]+?)\s*\((\d+)\)/gu)) {
      const name = match[1].trim();
      const points = Number.parseInt(match[2], 10);
      if (name.length > 0 && !Number.isNaN(points)) {
        spells.push({ name, points, source: currentSource });
      }
    }

    const bareMatch = trimmed.match(/^(.*?)(\d+)$/u);
    if (
      currentSource.toLowerCase().includes("spells") &&
      !trimmed.includes(":") &&
      !trimmed.includes("(") &&
      bareMatch
    ) {
      const name = bareMatch[1].trim();
      const points = Number.parseInt(bareMatch[2], 10);
      if (name.length > 0 && !Number.isNaN(points)) {
        spells.push({ name, points, source: currentSource });
      }
    }
  }

  return spells;
}

function parseWeaponLine(line: string): ParsedWeaponEntry | undefined {
  if (!line.includes("%")) return undefined;
  const tokens = line.split(/\s+/u);
  const percentIndex = tokens.findIndex((token) => token.includes("%"));
  if (percentIndex <= 0) return undefined;
  const percentage = extractInt(tokens[percentIndex]);
  if (percentage === undefined) return undefined;

  const srIndex = percentIndex - 1;
  const hasStrikeRank = isStrikeRankToken(tokens[srIndex]);
  const nameTokens = hasStrikeRank
    ? tokens.slice(0, srIndex)
    : tokens.slice(0, percentIndex);
  const name = nameTokens.join(" ").trim();
  if (name.length === 0) return undefined;

  const meaningfulTail = tokens.slice(percentIndex + 1).filter((token) => token !== "[" && token !== "]");
  const damageIndex = meaningfulTail.findIndex(isDamageToken);
  const damage = damageIndex >= 0 ? meaningfulTail[damageIndex] : undefined;
  const range =
    damageIndex >= 0 && meaningfulTail[damageIndex + 1] && /^\d+$/u.test(meaningfulTail[damageIndex + 1])
      ? meaningfulTail[damageIndex + 1]
      : undefined;

  return {
    name,
    percentage,
    damage,
    strikeRank: hasStrikeRank ? tokens[srIndex] : undefined,
    range,
  };
}

function spellHeading(line: string): string | undefined {
  if (line.toLowerCase() === "rune magic") return "Rune Magic";
  if (line.toLowerCase() === "spirit magic") return "Spirit Magic";
  if (line.toLowerCase().includes("spells")) return line;
  return undefined;
}

function isWeaponHeader(line: string): boolean {
  return canonicalFieldText(line).toLowerCase().startsWith("weapon sr hit% damage");
}

function isCombatNoise(line: string): boolean {
  const canonical = canonicalFieldText(line).toLowerCase();
  return (
    canonical.includes("hp total / currently") ||
    canonical.startsWith("healing rate:") ||
    canonical.startsWith("dex sr:") ||
    canonical.startsWith("sr12") ||
    canonical.startsWith("magic bonus") ||
    canonical.startsWith("attack ") ||
    canonical.startsWith("damage:") ||
    canonical.startsWith("sorcery") ||
    canonical.startsWith("free int:") ||
    /^[0-9]{1,2}(?:-[0-9]{1,2})?:\s/u.test(canonical)
  );
}

function isStrikeRankToken(token: string): boolean {
  return /^[0-9SMR/.]+$/u.test(token);
}

function isDamageToken(token: string): boolean {
  return /^(?:[0-9]+d[0-9]+(?:[+-][0-9]+)?|[0-9]+|special|\*)$/iu.test(token);
}

function extractInt(text?: string): number | undefined {
  if (!text) return undefined;
  const digits = [...text].filter((char) => /\d/u.test(char)).join("");
  return digits.length > 0 ? Number.parseInt(digits, 10) : undefined;
}
