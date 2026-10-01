"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { resolveSeriesColor } from "@/lib/deck/theme";
import type { ChartElement } from "@/lib/deck/types";
import { useTheme } from "../ThemeContext";

const TITLE_HEIGHT = 56;
const AXIS_FONT = 20;

type Props = { element: ChartElement; animate: boolean };

export function ChartBlock({ element, animate }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { frame, chartType, title, categories, series, options } = element;
  const width = frame.w;
  const height = Math.max(frame.h - (title ? TITLE_HEIGHT : 0), 40);
  const colorAt = (i: number) => resolveSeriesColor(series[i], i, theme);
  const format = (value: number | string) => `${options.valuePrefix}${value}${options.valueSuffix}`;

  const rows = categories.map((category, i) => {
    const row: Record<string, string | number> = { category };
    for (const s of series) row[s.name] = s.values[i] ?? 0;
    return row;
  });

  const axes = (
    <>
      {options.showGrid && <CartesianGrid stroke={colors.grid} vertical={false} />}
      <XAxis
        dataKey="category"
        tick={{ fontSize: AXIS_FONT, fill: colors.muted }}
        tickLine={false}
        axisLine={{ stroke: colors.grid }}
      />
      <YAxis
        tick={{ fontSize: AXIS_FONT, fill: colors.muted }}
        tickLine={false}
        axisLine={false}
        tickFormatter={format}
        width={96}
      />
      {options.showLegend && (
        <Legend
          verticalAlign="top"
          align="right"
          height={48}
          wrapperStyle={{ fontSize: AXIS_FONT, color: colors.text }}
          iconType="circle"
        />
      )}
    </>
  );

  const margin = { top: 16, right: 24, bottom: 8, left: 8 };
  const stackId = options.stacked ? "stack" : undefined;

  let chart: React.ReactNode;
  if (chartType === "pie") {
    const first = series[0];
    const slices = categories.map((name, i) => ({ name, value: first?.values[i] ?? 0 }));
    chart = (
      <PieChart width={width} height={height}>
        <Pie
          data={slices}
          dataKey="value"
          nameKey="name"
          outerRadius={Math.min(width, height) * 0.36}
          isAnimationActive={animate}
          label={{ fontSize: AXIS_FONT, fill: colors.text }}
        >
          {slices.map((slice, i) => (
            <Cell key={slice.name} fill={resolveSeriesColor(undefined, i, theme)} />
          ))}
        </Pie>
        {options.showLegend && (
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            wrapperStyle={{ fontSize: AXIS_FONT, color: colors.text }}
            iconType="circle"
          />
        )}
      </PieChart>
    );
  } else if (chartType === "line") {
    chart = (
      <LineChart width={width} height={height} data={rows} margin={margin}>
        {axes}
        {series.map((s, i) => (
          <Line
            key={s.name}
            dataKey={s.name}
            stroke={colorAt(i)}
            strokeWidth={4}
            dot={{ r: 6 }}
            isAnimationActive={animate}
          />
        ))}
      </LineChart>
    );
  } else if (chartType === "area") {
    chart = (
      <AreaChart width={width} height={height} data={rows} margin={margin}>
        {axes}
        {series.map((s, i) => (
          <Area
            key={s.name}
            dataKey={s.name}
            stackId={stackId}
            stroke={colorAt(i)}
            fill={colorAt(i)}
            fillOpacity={0.2}
            strokeWidth={3}
            isAnimationActive={animate}
          />
        ))}
      </AreaChart>
    );
  } else {
    chart = (
      <BarChart width={width} height={height} data={rows} margin={margin} barCategoryGap="24%">
        {axes}
        {series.map((s, i) => (
          <Bar
            key={s.name}
            dataKey={s.name}
            stackId={stackId}
            fill={colorAt(i)}
            radius={[6, 6, 0, 0]}
            isAnimationActive={animate}
          />
        ))}
      </BarChart>
    );
  }

  return (
    <div className="h-full w-full">
      {title && (
        <div
          style={{
            height: TITLE_HEIGHT,
            fontSize: 28,
            fontWeight: 600,
            color: colors.text,
            fontFamily: theme.fonts.body,
            lineHeight: `${TITLE_HEIGHT}px`,
          }}
        >
          {title}
        </div>
      )}
      {chart}
    </div>
  );
}
