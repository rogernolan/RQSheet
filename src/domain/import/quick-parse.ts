import type { ImportResult } from "@/domain/import/types";
import { createEmptyImportResult } from "@/domain/import/types";

export function quickParseImportText(rawText: string): ImportResult {
  const firstNonEmptyLine = rawText
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  return {
    ...createEmptyImportResult(),
    rawText,
    characterName: firstNonEmptyLine,
    characterInfo: {
      worships: [],
      candidateName: firstNonEmptyLine,
    },
  };
}
