"use client";

import { useEffect, useRef } from "react";

/** Keeps a scroll container pinned to the bottom whenever `dep` changes. */
export function useAutoScroll<T extends HTMLElement>(dep: unknown) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [dep]);

  return ref;
}
