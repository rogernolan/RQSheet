import type { Character } from "@/domain/types";

import { createCharacterRepository } from "./repository";
import type { CharacterRecordStore } from "./record-store";
import type { CharacterRepository } from "./types";

type IndexedDBCharacterRepositoryOptions = {
  databaseName?: string;
  storeName?: string;
  version?: number;
};

const DEFAULT_DATABASE_NAME = "rqsheet-web";
const DEFAULT_STORE_NAME = "characters";
const DEFAULT_VERSION = 1;

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

class IndexedDBCharacterStore implements CharacterRecordStore {
  constructor(
    private readonly databaseName: string,
    private readonly storeName: string,
    private readonly version: number,
  ) {}

  async listCharacters(): Promise<Character[]> {
    const db = await this.open();
    const transaction = db.transaction(this.storeName, "readonly");
    const store = transaction.objectStore(this.storeName);
    return requestToPromise(store.getAll());
  }

  async getCharacter(id: string): Promise<Character | null> {
    const db = await this.open();
    const transaction = db.transaction(this.storeName, "readonly");
    const store = transaction.objectStore(this.storeName);
    const result = await requestToPromise(store.get(id));
    return result ?? null;
  }

  async putCharacter(character: Character): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction(this.storeName, "readwrite");
    const store = transaction.objectStore(this.storeName);
    await requestToPromise(store.put(character));
  }

  async deleteCharacter(id: string): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction(this.storeName, "readwrite");
    const store = transaction.objectStore(this.storeName);
    await requestToPromise(store.delete(id));
  }

  private open(): Promise<IDBDatabase> {
    if (typeof indexedDB === "undefined") {
      throw new Error("IndexedDB is not available in this environment.");
    }

    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, this.version);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error("Failed to open IndexedDB database."));
      request.onblocked = () =>
        reject(new Error("IndexedDB database open request was blocked."));
    });
  }
}

export function createIndexedDBCharacterRepository(
  options: IndexedDBCharacterRepositoryOptions = {},
): CharacterRepository {
  const store = new IndexedDBCharacterStore(
    options.databaseName ?? DEFAULT_DATABASE_NAME,
    options.storeName ?? DEFAULT_STORE_NAME,
    options.version ?? DEFAULT_VERSION,
  );

  return createCharacterRepository(store);
}
