import type {
  DetectedTextImportSections,
  TextImportSectionKey,
} from "@/domain/import/types";
import {
  canonicalFieldText,
  normalizeImportText,
} from "@/domain/import/normalizer";

export function detectTextImportSections(
  rawText: string,
): DetectedTextImportSections {
  const normalized = normalizeImportText(rawText);
  const lines = normalized.split("\n");

  const attributesStart = firstIndex(lines, isAttributesHeading) ?? 0;
  const runesStart =
    firstIndex(lines, (line) => isRuneHeading(line) || isElementalRuneLine(line), attributesStart + 1) ??
    attributesStart;
  const passionsStart = firstIndex(lines, isPassionsHeading, runesStart + 1);
  const combatStart = firstIndex(
    lines,
    (line) => isCombatSignature(line) || isWeaponHeader(line),
    (passionsStart ?? runesStart) + 1,
  );
  const skillsStart = firstIndex(
    lines,
    isSkillGroupHeading,
    (combatStart ?? passionsStart ?? runesStart) + 1,
  );
  const magicStart = firstIndex(lines, isMagicHeading, (skillsStart ?? 0) + 1);
  const explicitEquipmentStart = firstIndex(
    lines,
    isExplicitEquipmentHeading,
    (magicStart ?? 0) + 1,
  );
  const backstoryStart = firstIndex(lines, isBackstoryHeading, (magicStart ?? 0) + 1);
  const explicitEquipmentEnd =
    explicitEquipmentStart !== undefined
      ? findEquipmentBlockEnd(lines, explicitEquipmentStart)
      : undefined;
  const trailingStart =
    explicitEquipmentEnd !== undefined
      ? nextNonEmptyLine(lines, explicitEquipmentEnd)
      : backstoryStart;
  const endOfStructuredText = trailingStart ?? lines.length;

  const sectionContents: Partial<Record<TextImportSectionKey, string>> = {};

  assignSection(sectionContents, "characterInfo", lines, 0, attributesStart);
  assignSection(sectionContents, "attributes", lines, attributesStart, runesStart);
  assignSection(
    sectionContents,
    "runes",
    lines,
    runesStart,
    passionsStart ?? combatStart ?? skillsStart ?? magicStart ?? endOfStructuredText,
  );

  if (passionsStart !== undefined) {
    assignSection(
      sectionContents,
      "passions",
      lines,
      passionsStart,
      combatStart ?? skillsStart ?? magicStart ?? endOfStructuredText,
    );
  }

  if (
    combatStart !== undefined &&
    skillsStart !== undefined &&
    combatStart < skillsStart
  ) {
    appendSection(sectionContents, "equipment", lines, combatStart, skillsStart);
  }

  if (skillsStart !== undefined) {
    assignSection(
      sectionContents,
      "skills",
      lines,
      skillsStart,
      magicStart ?? explicitEquipmentStart ?? endOfStructuredText,
    );
  }

  if (magicStart !== undefined) {
    assignSection(
      sectionContents,
      "magic",
      lines,
      magicStart,
      explicitEquipmentStart ?? trailingStart ?? lines.length,
    );
  }

  if (explicitEquipmentStart !== undefined) {
    appendSection(
      sectionContents,
      "equipment",
      lines,
      explicitEquipmentStart,
      explicitEquipmentEnd ?? trailingStart ?? lines.length,
    );
  }

  return {
    sectionContents,
    trailingNotes:
      trailingStart !== undefined
        ? joinLines(lines.slice(trailingStart))
        : undefined,
  };
}

export const detectImportSections = detectTextImportSections;

function assignSection(
  sections: Partial<Record<TextImportSectionKey, string>>,
  key: TextImportSectionKey,
  lines: string[],
  start: number,
  end: number,
) {
  if (start < 0 || end <= start || start >= lines.length) return;
  const content = joinLines(lines.slice(start, Math.min(end, lines.length)));
  if (content.length > 0) {
    sections[key] = content;
  }
}

function appendSection(
  sections: Partial<Record<TextImportSectionKey, string>>,
  key: TextImportSectionKey,
  lines: string[],
  start: number,
  end: number,
) {
  if (start < 0 || end <= start || start >= lines.length) return;
  const content = joinLines(lines.slice(start, Math.min(end, lines.length)));
  if (content.length === 0) return;
  sections[key] = sections[key] ? `${sections[key]}\n\n${content}` : content;
}

function joinLines(lines: string[]): string {
  return lines.join("\n").trim();
}

function firstIndex(
  lines: string[],
  predicate: (line: string) => boolean,
  start = 0,
): number | undefined {
  for (let index = Math.max(0, start); index < lines.length; index += 1) {
    if (predicate(lines[index])) return index;
  }
  return undefined;
}

function nextNonEmptyLine(lines: string[], afterIndex: number): number | undefined {
  for (let index = afterIndex + 1; index < lines.length; index += 1) {
    if (lines[index].trim().length > 0) return index;
  }
  return undefined;
}

function findEquipmentBlockEnd(lines: string[], start: number): number {
  let sawContent = false;
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line.length === 0) {
      if (sawContent) return index;
      continue;
    }
    sawContent = true;
    if (isBackstoryHeading(line)) {
      return index;
    }
  }
  return lines.length;
}

function isAttributesHeading(line: string): boolean {
  return canonicalFieldText(line).toLowerCase() === "characteristics";
}

function isRuneHeading(line: string): boolean {
  const canonical = canonicalFieldText(line).toLowerCase();
  return (
    canonical === "elemental rune" ||
    canonical === "elemental runes" ||
    canonical === "power rune" ||
    canonical === "power rune affinities" ||
    canonical === "power rune affinity"
  );
}

function isElementalRuneLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("Air:") ||
    trimmed.startsWith("Fire/Sky:") ||
    trimmed.startsWith("Darkness:") ||
    trimmed.startsWith("Water:") ||
    trimmed.startsWith("Earth:") ||
    trimmed.startsWith("Moon:")
  );
}

function isPassionsHeading(line: string): boolean {
  return canonicalFieldText(line).toLowerCase() === "passions";
}

function isCombatSignature(line: string): boolean {
  const canonical = canonicalFieldText(line).toLowerCase();
  return (
    canonical.includes("hp total / currently") ||
    canonical.includes("healing rate:")
  );
}

function isWeaponHeader(line: string): boolean {
  return canonicalFieldText(line).toLowerCase().startsWith("weapon sr hit% damage");
}

function isSkillGroupHeading(line: string): boolean {
  const canonical = canonicalFieldText(line).toLowerCase();
  return [
    "agility",
    "communication",
    "knowledge",
    "magic",
    "manipulation",
    "perception",
    "stealth",
  ].some((group) => canonical === group || canonical.startsWith(`${group} `));
}

function isMagicHeading(line: string): boolean {
  const canonical = canonicalFieldText(line).toLowerCase();
  return canonical === "rune magic" || canonical === "spirit magic";
}

function isExplicitEquipmentHeading(line: string): boolean {
  return canonicalFieldText(line).toLowerCase() === "equipment";
}

function isBackstoryHeading(line: string): boolean {
  return canonicalFieldText(line).toLowerCase() === "backstory:";
}
