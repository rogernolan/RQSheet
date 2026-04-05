export function normalizeImportText(rawText: string): string {
  const unifiedLineEndings = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const withoutBadges = unifiedLineEndings.replace(
    / ?Microbadge: Glorantha fan:\s*[^:\n]+? rune/gu,
    "",
  );

  return withoutBadges
    .split("\n")
    .map((line) => line.replace(/\t/g, " ").trim())
    .join("\n");
}

export function canonicalFieldText(text: string): string {
  return text
    .split(/\s+/u)
    .filter(Boolean)
    .join(" ");
}

export function isPlaceholderText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return false;
  }

  const normalized = trimmed.replace(/ /g, "");
  const uppercase = normalized.toUpperCase();
  const exactPlaceholders = new Set([
    "_",
    "__",
    "___",
    "____",
    "_____",
    "##",
    "#",
    "--",
    "--%",
    "?",
    "?%",
    "__/__",
  ]);

  if (exactPlaceholders.has(uppercase)) {
    return true;
  }

  return [...uppercase].every((character) => "_-#?%/".includes(character));
}
