"use client";

import { useEffect, useState } from "react";
import { getAsset } from "@/lib/storage/assets";

export type AssetUrlState = { kind: "loading" } | { kind: "ready"; url: string } | { kind: "missing" };

/**
 * Object URLs for uploaded images, shared across every place the same asset
 * renders (artboard, filmstrip, landing cover, print). Cached for the page's
 * lifetime: the blobs are small and a revoke while a thumbnail still shows
 * it would blank that thumbnail.
 */
const urls = new Map<string, Promise<string | null>>();

function resolve(assetId: string): Promise<string | null> {
  let pending = urls.get(assetId);
  if (!pending) {
    pending = getAsset(assetId)
      .then((asset) => (asset ? URL.createObjectURL(asset.blob) : null))
      .catch(() => null);
    urls.set(assetId, pending);
  }
  return pending;
}

export function useAssetUrl(assetId: string): AssetUrlState {
  const [state, setState] = useState<AssetUrlState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    void resolve(assetId).then((url) => {
      if (cancelled) return;
      setState(url ? { kind: "ready", url } : { kind: "missing" });
    });
    return () => {
      cancelled = true;
    };
  }, [assetId]);

  return state;
}
