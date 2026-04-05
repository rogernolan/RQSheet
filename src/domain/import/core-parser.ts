import {
  createEmptyImportResult,
  type CharacteristicKey,
  type DetectedTextImportSections,
  type ImportResult,
  type ParsedCharacterInfo,
  type ParsedPassionEntry,
  type RuneName,
} from "@/domain/import/types";
import {
  canonicalFieldText,
  isPlaceholderText,
} from "@/domain/import/normalizer";

export function parseTextImportCore(
  sections: DetectedTextImportSections,
): ImportResult {
  const result = createEmptyImportResult();

  const characterInfoText = sections.sectionContents.characterInfo;
  if (characterInfoText) {
    result.characterInfo = parseCharacterInfo(characterInfoText);
    result.coverage.expectedIdentityFields = expectedIdentityFieldCount(characterInfoText);
    result.coverage.foundIdentityFields = foundIdentityFieldCount(
      result.characterInfo,
    );
  }

  const attributesText = sections.sectionContents.attributes;
  if (attributesText) {
    result.attributes = parseAttributes(attributesText);
  }
  result.coverage.expectedAttributes = 7;
  result.coverage.foundAttributes = Object.keys(result.attributes).length;

  const runesText = sections.sectionContents.runes;
  if (runesText) {
    result.runePercentages = parseRunes(runesText);
  }
  result.coverage.expectedRunes = 16;
  result.coverage.foundRunes = Object.keys(result.runePercentages).length;

  const passionsText = sections.sectionContents.passions;
  if (passionsText) {
    result.characterInfo.honor = parseHonor(passionsText);
    result.passions = parsePassions(passionsText);
  }
  result.coverage.foundPassions = result.passions.length;

  return result;
}

export const parseCoreImportSections = parseTextImportCore;

function parseCharacterInfo(section: string): ParsedCharacterInfo {
  const flattened = canonicalFieldText(section);
  const lines = section.split("\n");
  const cults = parseCults(lines);

  return {
    candidateName:
      cleanedValue(extractField(flattened, "Name:", FIELD_STOP_PATTERNS)) ??
      fallbackName(lines),
    family: cleanedValue(
      extractField(
        flattened,
        "Family:|Nochet House:|(?<!Patron )House:",
        FIELD_STOP_PATTERNS,
      ),
    ),
    patron: cleanedValue(
      extractField(flattened, "Patron House:", FIELD_STOP_PATTERNS),
    ),
    originalHouse: cleanedValue(
      extractField(flattened, "Original House\\s*:?", FIELD_STOP_PATTERNS),
    ),
    dateOfBirth: cleanedValue(
      extractField(flattened, "Born:", FIELD_STOP_PATTERNS),
    ),
    occupation: cleanedValue(
      extractField(flattened, "Occupation:", FIELD_STOP_PATTERNS),
    ),
    reputation: extractInt(
      extractField(flattened, "Reputation:", FIELD_STOP_PATTERNS),
    ),
    sol: cleanedValue(extractField(flattened, "SoL:", FIELD_STOP_PATTERNS)),
    income: cleanedValue(
      extractField(flattened, "Income:", FIELD_STOP_PATTERNS),
    ),
    ransom: extractInt(
      extractField(flattened, "Ransom:", FIELD_STOP_PATTERNS),
    ),
    cult: cults[0],
    worships: cults.slice(1),
  };
}

function parseAttributes(
  section: string,
): Partial<Record<CharacteristicKey, number>> {
  const flattened = canonicalFieldText(section);
  const pairs: Array<[CharacteristicKey, string]> = [
    ["str", "STR"],
    ["con", "CON"],
    ["siz", "SIZ"],
    ["dex", "DEX"],
    ["int", "INT"],
    ["pow", "POW"],
    ["cha", "CHA"],
  ];

  return Object.fromEntries(
    pairs
      .map(([key, label]) => {
        const value = extractInt(match(flattened, new RegExp(`\\b${label}:\\s*([0-9]+)`)));
        return value !== undefined ? [key, value] : undefined;
      })
      .filter(Boolean) as Array<[CharacteristicKey, number]>,
  );
}

function parseRunes(section: string): Partial<Record<RuneName, number>> {
  const runePercentages: Partial<Record<RuneName, number>> = {};

  for (const line of section.split("\n")) {
    const trimmed = line.trim();
    if (
      trimmed.length === 0 ||
      isRuneHeadingLine(trimmed) ||
      trimmed.includes("must total 100%")
    ) {
      continue;
    }

    const simpleMatch = trimmed.match(/^([A-Za-z/]+):\s*([~]?[0-9]+)/u);
    if (simpleMatch) {
      const rune = runeName(simpleMatch[1]);
      const value = extractInt(simpleMatch[2]);
      if (rune && value !== undefined) {
        runePercentages[rune] = value;
        continue;
      }
    }

    const pairedMatch = trimmed.match(
      /.*?([0-9]+)\s+([A-Za-z/*]+)\s*\|\s*([A-Za-z/*]+)\s+([0-9]+)/u,
    );
    if (pairedMatch) {
      const leftRune = runeName(pairedMatch[2]);
      const rightRune = runeName(pairedMatch[3]);
      const left = extractInt(pairedMatch[1]);
      const right = extractInt(pairedMatch[4]);

      if (leftRune && rightRune && left !== undefined && right !== undefined) {
        runePercentages[leftRune] = left;
        runePercentages[rightRune] = right;
      }
    }
  }

  return runePercentages;
}

function parsePassions(section: string): ParsedPassionEntry[] {
  return section
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 && line.localeCompare("Passions", undefined, { sensitivity: "accent" }) !== 0,
    )
    .flatMap((line) => {
      const match = line.match(/^(.*?)([0-9]+)%/u);
      if (!match) return [];

      const cleanedName = match[1]
        .replace(/:/g, "")
        .replace(/\?/g, "")
        .trim();
      const percentage = Number.parseInt(match[2], 10);

      if (
        cleanedName.length === 0 ||
        cleanedName.toLowerCase() === "honor" ||
        Number.isNaN(percentage)
      ) {
        return [];
      }

      return [
        {
          name: cleanedName,
          percentage,
        },
      ];
    });
}

function parseHonor(section: string): number | undefined {
  for (const line of section.split("\n")) {
    const match = line.trim().match(/^(.*?)([0-9]+)%/u);
    if (!match) continue;
    const cleanedName = match[1].replace(/:/g, "").replace(/\?/g, "").trim();
    if (cleanedName.toLowerCase() === "honor") {
      return Number.parseInt(match[2], 10);
    }
  }

  return undefined;
}

function parseCults(lines: string[]): string[] {
  return lines.flatMap((line) => {
    const trimmed = line.trim();
    if (
      !trimmed.toLowerCase().includes("initiate of") &&
      !trimmed.startsWith("Cult:")
    ) {
      return [];
    }

    const rawCult = trimmed
      .replace(/Cult:/iu, "")
      .replace(/Initiate of/iu, "")
      .trim();
    const value = cleanedValue(rawCult);

    return value ? [value] : [];
  });
}

function expectedIdentityFieldCount(section: string): number {
  const flattened = canonicalFieldText(section);
  const lines = section.split("\n");
  let count = 0;

  if (extractField(flattened, "Name:", FIELD_STOP_PATTERNS) || fallbackName(lines)) count += 1;
  if (
    extractField(
      flattened,
      "Family:|Nochet House:|(?<!Patron )House:",
      FIELD_STOP_PATTERNS,
    )
  )
    count += 1;
  if (extractField(flattened, "Patron House:", FIELD_STOP_PATTERNS)) count += 1;
  if (extractField(flattened, "Original House\\s*:?", FIELD_STOP_PATTERNS))
    count += 1;
  if (extractField(flattened, "Born:", FIELD_STOP_PATTERNS)) count += 1;
  if (extractField(flattened, "Occupation:", FIELD_STOP_PATTERNS)) count += 1;
  if (extractField(flattened, "Reputation:", FIELD_STOP_PATTERNS)) count += 1;
  if (extractField(flattened, "SoL:", FIELD_STOP_PATTERNS)) count += 1;
  if (extractField(flattened, "Income:", FIELD_STOP_PATTERNS)) count += 1;
  if (extractField(flattened, "Ransom:", FIELD_STOP_PATTERNS)) count += 1;
  if (parseCults(lines).length > 0) count += 1;

  return count;
}

function foundIdentityFieldCount(info: ParsedCharacterInfo): number {
  const values = [
    info.candidateName,
    info.family,
    info.patron,
    info.originalHouse,
    info.dateOfBirth,
    info.occupation,
    info.sol,
    info.income,
    info.cult,
  ].filter(Boolean).length;

  return values + (info.reputation !== undefined ? 1 : 0) + (info.ransom !== undefined ? 1 : 0);
}

function fallbackName(lines: string[]): string | undefined {
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.length === 0 ||
      trimmed.includes(":") ||
      isAttributesHeadingLine(trimmed) ||
      isRuneHeadingLine(trimmed) ||
      trimmed.toLowerCase().includes("passions")
    ) {
      continue;
    }
    return trimmed;
  }
  return undefined;
}

function extractField(
  text: string,
  labelPattern: string,
  stopPatterns: string[],
): string | undefined {
  const stops = stopPatterns.join("|");
  const pattern = new RegExp(
    `(?:${labelPattern})\\s*(.*?)\\s*(?=(?:${stops})|$)`,
    "iu",
  );
  return match(text, pattern);
}

function cleanedValue(text?: string): string | undefined {
  if (!text) return undefined;
  const trimmed = text.trim();
  if (trimmed.length === 0 || isPlaceholderText(trimmed)) {
    return undefined;
  }
  return trimmed;
}

function extractInt(text?: string): number | undefined {
  if (!text) return undefined;
  const matchResult = /\d+/u.exec(text);
  return matchResult ? Number.parseInt(matchResult[0], 10) : undefined;
}

function match(text: string, pattern: RegExp): string | undefined {
  const result = text.match(pattern);
  return result?.[1];
}

function runeName(text: string): RuneName | undefined {
  const cleaned = text.replace(/\*/g, "").replace(/ /g, "").toLowerCase();
  const mapping: Record<string, RuneName> = {
    air: "air",
    "fire/sky": "fire",
    darkness: "darkness",
    water: "water",
    earth: "earth",
    moon: "moon",
    man: "man",
    beast: "beast",
    fertility: "fertility",
    death: "death",
    harmony: "harmony",
    disorder: "disorder",
    truth: "truth",
    illusion: "illusion",
    stasis: "stasis",
    movement: "movement",
  };
  return mapping[cleaned];
}

function isAttributesHeadingLine(line: string): boolean {
  return canonicalFieldText(line).toLowerCase() === "characteristics";
}

function isRuneHeadingLine(line: string): boolean {
  const canonical = canonicalFieldText(line).toLowerCase();
  return (
    canonical === "elemental rune" ||
    canonical === "elemental runes" ||
    canonical === "power rune" ||
    canonical === "power rune affinities"
  );
}

const FIELD_STOP_PATTERNS = [
  "Name:",
  "Family:",
  "Nochet House:",
  "(?<!Patron )House:",
  "Patron House:",
  "Original House\\s*:?",
  "Born:",
  "Reputation:",
  "Occupation:",
  "SoL:",
  "Income:",
  "Ransom:",
  "NOW\\s*:",
  "MOV:",
  "Cult:",
  "Initiate of",
];
