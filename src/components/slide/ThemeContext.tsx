"use client";

import { createContext, useContext } from "react";
import { DEFAULT_THEME, type Theme } from "@/lib/deck/theme";

const ThemeContext = createContext<Theme>(DEFAULT_THEME);

/** Wrap anything that renders slides (editor, print) in the deck's theme. */
export function ThemeProvider({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
