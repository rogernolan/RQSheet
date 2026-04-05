import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export function loadTextImportFixture(name: string): string {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  return readFileSync(
    path.resolve(
      currentDirectory,
      `../text-import/${name}.txt`,
    ),
    "utf8",
  );
}
