import { describe, expect, it, vi } from "vitest";

import { persistAutosave } from "@/components/character-shell/autosave";

describe("persistAutosave", () => {
  it("marks a draft as saved after persistence succeeds", async () => {
    const save = vi.fn(async () => undefined);
    const markSaved = vi.fn();

    await persistAutosave(save, markSaved);

    expect(save).toHaveBeenCalledTimes(1);
    expect(markSaved).toHaveBeenCalledTimes(1);
  });

  it("does not mark a draft as saved when persistence fails", async () => {
    const save = vi.fn(async () => {
      throw new Error("IndexedDB failed");
    });
    const markSaved = vi.fn();

    await expect(persistAutosave(save, markSaved)).rejects.toThrow("IndexedDB failed");
    expect(markSaved).not.toHaveBeenCalled();
  });
});
