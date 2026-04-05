import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadTextImportFixture(name: string): Promise<string> {
  const filePath = path.resolve(
    process.cwd(),
    "src/tests/fixtures/text-import",
    `${name}.txt`,
  );

  return readFile(filePath, "utf8");
}
