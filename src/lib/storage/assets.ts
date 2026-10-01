import { STORES, isStorageAvailable, withStore } from "./db";

/**
 * Uploaded images. The deck only carries `{ kind: "asset", assetId }`, so the
 * model never sees image bytes and the deck JSON stays small; the blob lives
 * here and is resolved to an object URL when a slide renders.
 */
export type AssetRecord = {
  id: string;
  blob: Blob;
  name: string;
  createdAt: number;
};

export const MAX_ASSET_BYTES = 8 * 1024 * 1024;

export class AssetError extends Error {}

export async function putImageAsset(file: File): Promise<string> {
  if (!isStorageAvailable()) throw new AssetError("This browser cannot store images.");
  if (!file.type.startsWith("image/")) throw new AssetError("Choose an image file (PNG, JPG, GIF, WebP or SVG).");
  if (file.size > MAX_ASSET_BYTES) throw new AssetError(`Images must be under ${MAX_ASSET_BYTES / 1024 / 1024} MB.`);
  const record: AssetRecord = { id: newAssetId(), blob: file, name: file.name, createdAt: Date.now() };
  await withStore(STORES.assets, "readwrite", (s) => s.put(record));
  return record.id;
}

export async function getAsset(id: string): Promise<AssetRecord | null> {
  if (!isStorageAvailable()) return null;
  const raw = await withStore<unknown>(STORES.assets, "readonly", (s) => s.get(id));
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<AssetRecord>;
  return r.blob instanceof Blob && typeof r.id === "string"
    ? { id: r.id, blob: r.blob, name: r.name ?? "", createdAt: r.createdAt ?? 0 }
    : null;
}

export async function deleteAsset(id: string): Promise<void> {
  if (!isStorageAvailable()) return;
  await withStore(STORES.assets, "readwrite", (s) => s.delete(id));
}

function newAssetId(): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(16).slice(2) + Date.now().toString(16);
  return `asset_${uuid.replace(/-/g, "").slice(0, 12)}`;
}
