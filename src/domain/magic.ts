export type MagicSpellSection = "spirit" | "rune";

export function classifySpellSource(source: string): MagicSpellSection {
  const normalized = source.trim().toLowerCase();

  if (
    normalized.includes("spirit") ||
    normalized.includes("spells in mind") ||
    normalized.includes("matrix spells") ||
    normalized.includes("spells known")
  ) {
    return "spirit";
  }

  return "rune";
}

