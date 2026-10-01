"use client";

import { ImageIcon } from "lucide-react";
import { useAssetUrl } from "@/hooks/use-asset-url";
import type { ImageElement } from "@/lib/deck/types";
import { useTheme } from "../ThemeContext";

export function ImageBody({ element }: { element: ImageElement }) {
  switch (element.src.kind) {
    case "url":
      return <Picture src={element.src.url} element={element} />;
    case "asset":
      return <AssetPicture assetId={element.src.assetId} element={element} />;
    case "placeholder":
      return <Frame element={element} label={element.src.label} />;
  }
}

function AssetPicture({ assetId, element }: { assetId: string; element: ImageElement }) {
  const asset = useAssetUrl(assetId);
  if (asset.kind === "ready") return <Picture src={asset.url} element={element} />;
  return <Frame element={element} label={asset.kind === "loading" ? "Loading image…" : "Image not found in this browser"} />;
}

function Picture({ src, element }: { src: string; element: ImageElement }) {
  return (
    <img
      src={src}
      alt={element.alt}
      draggable={false}
      className="h-full w-full"
      style={{ objectFit: element.fit }}
    />
  );
}

/** The empty frame: an icon and a label on the theme's surface colour. */
function Frame({ element, label }: { element: ImageElement; label: string }) {
  const { colors } = useTheme();
  return (
    <div
      role="img"
      aria-label={element.alt || label}
      className="flex h-full w-full flex-col items-center justify-center gap-6 text-center"
      style={{ background: colors.surface, color: colors.muted, padding: 40 }}
    >
      <ImageIcon style={{ width: 72, height: 72 }} strokeWidth={1.25} />
      <span style={{ fontSize: 26, lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}
