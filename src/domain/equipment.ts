import type { CharacterEquipmentRecord } from "@/domain/types";

function clampEnc(value: number | undefined): number {
  if (typeof value !== "number" || Number.isFinite(value) === false) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

export function normalizeEquipment(
  items: CharacterEquipmentRecord[] | undefined,
): CharacterEquipmentRecord[] {
  return (items ?? []).map((item) => ({
    name: item.name ?? "",
    enc: clampEnc(item.enc),
    isEquipped: item.isEquipped ?? false,
  }));
}

export function createImportedEquipment(items: string[]): CharacterEquipmentRecord[] {
  return normalizeEquipment(
    items.map((name) => ({
      name,
      enc: 0,
      isEquipped: false,
    })),
  );
}

