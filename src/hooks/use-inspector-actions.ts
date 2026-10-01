"use client";

import { useMemo } from "react";
import type { ChartElement, ChartType, ImageElement, TableElement } from "@/lib/deck/types";
import { useDeckStore } from "@/store/deck-store";

/**
 * Inspector edits as tool calls on the active slide. Each call is one undo
 * step. The element passed in is the current one from the store, so every
 * edit is built from fresh data.
 */

export function useTableActions(table: TableElement) {
  const run = useDeckStore((s) => s.run);
  return useMemo(() => {
    const slideId = () => useDeckStore.getState().activeSlideId ?? "";
    const headers = () => table.columns.map((c) => c.header);
    const cells = () => table.rows.map((r) => [...r.cells]);
    const grid = (columns: string[], rows: string[][]) =>
      run("update_element", { slideId: slideId(), elementId: table.id, columns, rows });

    return {
      setHeader: (index: number, text: string) => {
        const columns = headers();
        columns[index] = text;
        grid(columns, cells());
      },
      setCell: (row: number, col: number, text: string) => {
        const rows = cells();
        rows[row][col] = text;
        grid(headers(), rows);
      },
      addRow: () => grid(headers(), [...cells(), table.columns.map(() => "")]),
      addColumn: () =>
        grid([...headers(), `Column ${table.columns.length + 1}`], cells().map((r) => [...r, ""])),
    };
  }, [run, table]);
}

export function useChartActions(chart: ChartElement) {
  const run = useDeckStore((s) => s.run);
  return useMemo(() => {
    const slideId = () => useDeckStore.getState().activeSlideId ?? "";
    const base = () => ({ slideId: slideId(), elementId: chart.id });
    const series = () => chart.series.map((s) => ({ ...s, values: [...s.values] }));

    return {
      setType: (chartType: ChartType) => run("change_chart_type", { ...base(), chartType }),
      setOption: (key: "showLegend" | "showGrid", on: boolean) =>
        run("update_chart_data", { ...base(), options: { [key]: on } }),
      setTitle: (title: string) => run("update_chart_data", { ...base(), title }),
      setSeriesName: (index: number, name: string) => {
        if (!name.trim()) return;
        const next = series();
        next[index].name = name;
        run("update_chart_data", { ...base(), series: next });
      },
      setCategory: (index: number, name: string) => {
        const categories = [...chart.categories];
        categories[index] = name;
        run("update_chart_data", { ...base(), categories });
      },
      setValue: (seriesIndex: number, row: number, raw: string) => {
        const value = Number(raw);
        if (!Number.isFinite(value)) return;
        const next = series();
        next[seriesIndex].values[row] = value;
        run("update_chart_data", { ...base(), series: next });
      },
      addRow: () =>
        run("update_chart_data", {
          ...base(),
          categories: [...chart.categories, `Item ${chart.categories.length + 1}`],
          series: series().map((s) => ({ ...s, values: [...s.values, 0] })),
        }),
      addSeries: () =>
        run("update_chart_data", {
          ...base(),
          series: [...series(), { name: `Series ${chart.series.length + 1}`, values: chart.categories.map(() => 0) }],
        }),
    };
  }, [run, chart]);
}

export function useImageActions(image: ImageElement) {
  const run = useDeckStore((s) => s.run);
  return useMemo(() => {
    const base = () => ({ slideId: useDeckStore.getState().activeSlideId ?? "", elementId: image.id });
    return {
      setAlt: (alt: string) => run("update_element", { ...base(), alt }),
      setFit: (fit: ImageElement["fit"]) => run("update_element", { ...base(), fit }),
      /** Swaps the picture. A file's name becomes the alt when the current one is empty or just the placeholder label. */
      setSource: (src: ImageElement["src"], alt?: string) => {
        const generic = !image.alt || (image.src.kind === "placeholder" && image.alt === image.src.label);
        run("update_element", { ...base(), src, ...(alt && generic ? { alt } : {}) });
      },
    };
  }, [run, image]);
}
