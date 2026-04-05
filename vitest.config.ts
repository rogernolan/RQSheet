import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/lib/storage": path.resolve(__dirname, "./src/lib/storage/index.ts"),
    },
  },
  test: {
    include: ["src/tests/**/*.test.ts"],
  },
});
