"use client";

import { useChartActions } from "@/hooks/use-inspector-actions";
import { useTheme } from "@/components/slide/ThemeContext";
import { resolveSeriesColor } from "@/lib/deck/theme";
import type { ChartElement, ChartType } from "@/lib/deck/types";
import { CommitField } from "./CommitField";
import { InspectorHeader } from "./InspectorHeader";
import { FIELD, SECONDARY, SEGMENT_GROUP, segment } from "./styles";
import { Toggle } from "./Toggle";

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
];

export function ChartInspector({ chart }: { chart: ChartElement }) {
  const actions = useChartActions(chart);
  const theme = useTheme();

  return (
    <>
      <InspectorHeader title="Chart">
        <div role="radiogroup" aria-label="Chart type" className={SEGMENT_GROUP}>
          {CHART_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={chart.chartType === t.value}
              onClick={() => actions.setType(t.value)}
              className={segment(chart.chartType === t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Toggle label="Legend" on={chart.options.showLegend} onChange={(on) => actions.setOption("showLegend", on)} />
        <Toggle label="Grid" on={chart.options.showGrid} onChange={(on) => actions.setOption("showGrid", on)} />
      </InspectorHeader>

      <div className="flex min-h-0 gap-6 overflow-auto px-4 pb-4">
        <label className="flex w-56 shrink-0 flex-col gap-1">
          <span className="text-xs text-muted">Title</span>
          <CommitField value={chart.title} onCommit={actions.setTitle} className={FIELD} />
        </label>

        <table className="border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="px-1 pb-1 text-left text-xs font-normal text-muted">Category</th>
              {chart.series.map((s, i) => (
                <th key={i} className="px-1 pb-1 text-left">
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: resolveSeriesColor(s, i, theme) }}
                    />
                    <CommitField
                      value={s.name}
                      onCommit={(name) => actions.setSeriesName(i, name)}
                      aria-label="Series name"
                      className={`${FIELD} w-28 font-medium`}
                    />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.categories.map((category, row) => (
              <tr key={row}>
                <td className="p-1">
                  <CommitField
                    value={category}
                    onCommit={(name) => actions.setCategory(row, name)}
                    aria-label="Category"
                    className={`${FIELD} w-28`}
                  />
                </td>
                {chart.series.map((s, i) => (
                  <td key={i} className="p-1">
                    <CommitField
                      value={String(s.values[row] ?? "")}
                      onCommit={(raw) => actions.setValue(i, row, raw)}
                      inputMode="decimal"
                      aria-label={`${s.name}, ${category}`}
                      className={`${FIELD} w-28 text-right tabular-nums`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex shrink-0 flex-col gap-1.5 self-start pt-5">
          <button type="button" onClick={actions.addRow} className={SECONDARY}>
            Add row
          </button>
          <button type="button" onClick={actions.addSeries} className={SECONDARY}>
            Add series
          </button>
        </div>
      </div>
    </>
  );
}
