/**
 * Minimal IndexedDB plumbing. One database, versioned schema, promise-wrapped
 * requests. Kept dependency-free; the whole surface is `withStore`.
 */

const DB_NAME = "presentation-builder";
/** v1: decks. v2: assets (uploaded image blobs). */
const DB_VERSION = 2;

export const STORES = {
  decks: "decks",
  assets: "assets",
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

let opening: Promise<IDBDatabase> | null = null;

export function isStorageAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

function open(): Promise<IDBDatabase> {
  if (opening) return opening;
  opening = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.decks)) {
        const decks = db.createObjectStore(STORES.decks, { keyPath: "id" });
        decks.createIndex("updatedAt", "updatedAt");
      }
      if (!db.objectStoreNames.contains(STORES.assets)) {
        db.createObjectStore(STORES.assets, { keyPath: "id" });
      }
    };
    req.onsuccess = () => {
      req.result.onversionchange = () => req.result.close();
      resolve(req.result);
    };
    req.onerror = () => {
      opening = null;
      reject(req.error ?? new Error("IndexedDB open failed"));
    };
  });
  return opening;
}

/** Runs `fn` in a transaction on one store and resolves with its request result. */
export async function withStore<T>(
  name: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(name, mode);
    const req = fn(tx.objectStore(name));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error(`IndexedDB ${mode} on ${name} failed`));
    tx.onabort = () => reject(tx.error ?? new Error(`IndexedDB transaction aborted on ${name}`));
  });
}
