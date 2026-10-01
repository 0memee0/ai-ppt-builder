"use client";

import type { SlideElement } from "@/lib/deck/types";
import { ChartBlock } from "./elements/ChartBlock";
import { ImageBody } from "./elements/ImageBody";
import { ShapeBody } from "./elements/ShapeBody";
import { TableBody } from "./elements/TableBody";
import { TextBody } from "./elements/TextBody";

type Props = { element: SlideElement; animate: boolean; hidden?: boolean };

/** Positions one element at its frame and delegates drawing to the body for its type. */
export function ElementView({ element, animate, hidden = false }: Props) {
  const { x, y, w, h, rotation } = element.frame;
  return (
    <div
      data-element-id={element.id}
      className="absolute"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        visibility: hidden ? "hidden" : undefined,
      }}
    >
      <ElementBody element={element} animate={animate} />
    </div>
  );
}

function ElementBody({ element, animate }: Props) {
  switch (element.type) {
    case "text":
      return <TextBody element={element} />;
    case "image":
      return <ImageBody element={element} />;
    case "chart":
      return <ChartBlock element={element} animate={animate} />;
    case "table":
      return <TableBody element={element} />;
    case "shape":
      return <ShapeBody element={element} />;
  }
}
