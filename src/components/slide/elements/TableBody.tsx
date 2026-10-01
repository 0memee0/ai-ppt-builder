"use client";

import { contrastText } from "@/lib/deck/color";
import { resolveTableStyle } from "@/lib/deck/theme";
import type { TableElement } from "@/lib/deck/types";
import { useTheme } from "../ThemeContext";

export function TableBody({ element }: { element: TableElement }) {
  const s = resolveTableStyle(element.style, useTheme());
  const cell: React.CSSProperties = {
    border: `2px solid ${s.gridColor}`,
    padding: `${Math.round(s.fontSize * 0.55)}px ${Math.round(s.fontSize * 0.8)}px`,
    textAlign: s.align,
  };
  // The header sits on its own fill; textColor is for body cells on the slide.
  const headerColor = contrastText(s.headerFill);

  return (
    <table
      className="h-full w-full border-collapse"
      style={{ fontSize: s.fontSize, color: s.textColor, tableLayout: "fixed" }}
    >
      <thead>
        <tr>
          {element.columns.map((col) => (
            <th key={col.id} style={{ ...cell, background: s.headerFill, color: headerColor, fontWeight: 600 }}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {element.rows.map((row) => (
          <tr key={row.id}>
            {row.cells.map((value, i) => (
              <td key={element.columns[i]?.id ?? i} style={cell}>
                {value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
