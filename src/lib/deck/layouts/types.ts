import type { Frame } from "../types";

/**
 * A layout is a named set of regions on the 1920×1080 artboard plus the
 * guidance the model gets for filling it. Everything that used to be a
 * switch on the layout id (default frames, prompt text, zod enum) derives
 * from this registry, so adding a layout is one entry.
 */
export type LayoutRegions = {
  /** Where the title element lands when a slide is created with one. */
  title: Frame;
  /** Named content regions the populate step can reference. */
  [region: string]: Frame;
};

export type LayoutSpec = {
  id: string;
  name: string;
  /** One phrase for the OUTLINE prompt's layout list. */
  description: string;
  /** Instruction for the POPULATE step on a slide with this layout. */
  hint: string;
  /** Hero layouts centre a large title; content layouts put it in the top band. */
  hero: boolean;
  regions: LayoutRegions;
};
