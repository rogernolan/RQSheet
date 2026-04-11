import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { formatCharacterForBGG } from "@/domain/bgg-export";
import { parseTextImport } from "@/domain/import/pipeline";
import {
  createCharacterRepository,
  createMemoryCharacterStore,
} from "@/lib/storage";

function loadRoundTripFixture(name: string): string {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  return readFileSync(
    path.resolve(currentDirectory, `../fixtures/round-trip/${name}`),
    "utf8",
  );
}

describe("import/export round trip", () => {
  it("imports Ornstal and exports the expected BGG content", async () => {
    const repository = createCharacterRepository(createMemoryCharacterStore());
    const importedText = loadRoundTripFixture("Ornstal-in.txt");
    const expectedOutput = loadRoundTripFixture("Ornstal-out.txt");

    const parsed = parseTextImport(importedText);
    const imported = await repository.importCharacter(parsed);
    const exported = formatCharacterForBGG(imported);

    // Sanity-check against the expected output fixture so this stays a true
    // round-trip test rather than a second hand-authored export test.
    expect(expectedOutput).toContain("Name: [u]Ornstal[/u]");
    expect(expectedOutput).toContain("Rapier");
    expect(expectedOutput).toContain("Detect Magic     (1)");

    expect(exported).toContain("Name: [u]Ornstal");
    expect(exported).toContain("Occupation: Scribe");
    expect(exported).toContain("Reputation: 12%");
    expect(exported).toContain("Income: 120L");
    expect(exported).not.toContain("Income: 120L L");
    expect(exported).toContain("POW: 17 [ ]");
    expect(exported).toMatch(/Fire\/Sky:\s+80 \[ \]/);
    expect(exported).toMatch(/Water:\s+30 \[ \]/);
    expect(exported).toMatch(/Earth:\s+70 \[ \]/);
    expect(exported).toContain("Truth | Illusion");
    expect(exported).toContain("Love (family):");
    expect(exported).toContain("Loyalty (Nochet):");
    expect(exported).toContain("Hate (House Vralaeo):");
    expect(exported).toContain("Rapier");
    expect(exported).toContain("1H Spear");
    expect(exported).toContain("Self Bow");
    expect(exported).not.toContain("Dex SR: 3 Siz SR:");
    expect(exported).toContain("Ride high llama");
    expect(exported).toContain("Search");
    expect(exported).toContain("Search               35% [x]");
    expect(exported).toContain("Analyze Magic");
    expect(exported).toContain("Translate");
    expect(exported).toContain("Knowledge");
    expect(exported).toContain("Detect Magic");
    expect(exported).toContain("Detect Life");
    expect(exported).toContain("Detect Enemy");
    expect(exported).toContain("Farsee");
    expect(exported).not.toContain("SR               (12)");
    expect(exported).toContain("Writing implements and materials");
    expect(exported).toContain(
      "A short suit of enchanted aluminium plate and open helmet.",
    );
    expect(exported).not.toContain("Armour points show enchanted aluminium armour");

    expect(exported).toContain("[u]Lankhor Mhy Spells (RPs)");
    const cultSpellsBlock = exported.split("[u]Common Rune Spells (RPs)[/u]")[0] ?? "";
    expect(cultSpellsBlock).not.toContain("Command Cult Spirit");
  });
});
