"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useImageActions } from "@/hooks/use-inspector-actions";
import type { ImageElement } from "@/lib/deck/types";
import { AssetError, putImageAsset } from "@/lib/storage/assets";
import { CommitField } from "./CommitField";
import { InspectorHeader } from "./InspectorHeader";
import { FIELD, SECONDARY, SEGMENT_GROUP, segment } from "./styles";

const FITS = ["cover", "contain"] as const;

/**
 * Image panel. The picture comes from an upload (stored in this browser as
 * an asset) or a URL; either replaces the placeholder in one undo step.
 */
export function ImageInspector({ image }: { image: ImageElement }) {
  const actions = useImageActions(image);
  const fileInput = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<{ kind: "idle" } | { kind: "busy" } | { kind: "error"; message: string }>({ kind: "idle" });

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setUpload({ kind: "busy" });
    try {
      const assetId = await putImageAsset(file);
      actions.setSource({ kind: "asset", assetId }, file.name.replace(/\.[a-z0-9]+$/i, ""));
      setUpload({ kind: "idle" });
    } catch (error) {
      setUpload({ kind: "error", message: error instanceof AssetError ? error.message : "The image could not be saved." });
    }
  };

  const hasPicture = image.src.kind !== "placeholder";

  return (
    <>
      <InspectorHeader title="Image">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={upload.kind === "busy"}
          onClick={() => fileInput.current?.click()}
          className={`${SECONDARY} flex items-center gap-1.5 disabled:opacity-40`}
        >
          <Upload className="size-3.5" />
          {upload.kind === "busy" ? "Saving…" : hasPicture ? "Replace" : "Upload"}
        </button>
      </InspectorHeader>
      <div className="flex flex-wrap gap-6 px-4 pb-4">
        <label className="flex w-96 flex-col gap-1">
          <span className="text-xs text-muted">Image URL</span>
          <CommitField
            value={image.src.kind === "url" ? image.src.url : ""}
            placeholder={image.src.kind === "asset" ? "Uploaded image · paste a URL to replace it" : "https://…"}
            onCommit={(url) => {
              const trimmed = url.trim();
              if (trimmed) actions.setSource({ kind: "url", url: trimmed });
            }}
            className={FIELD}
          />
        </label>
        <label className="flex w-72 flex-col gap-1">
          <span className="text-xs text-muted">Alt text</span>
          <CommitField value={image.alt} onCommit={actions.setAlt} className={FIELD} />
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">Fit</span>
          <div role="radiogroup" aria-label="Fit" className={SEGMENT_GROUP}>
            {FITS.map((fit) => (
              <button
                key={fit}
                type="button"
                role="radio"
                aria-checked={image.fit === fit}
                onClick={() => actions.setFit(fit)}
                className={`${segment(image.fit === fit)} capitalize`}
              >
                {fit}
              </button>
            ))}
          </div>
        </div>
        {upload.kind === "error" && (
          <p role="alert" className="basis-full text-xs text-danger">
            {upload.message}
          </p>
        )}
      </div>
    </>
  );
}
