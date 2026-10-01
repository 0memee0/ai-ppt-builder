import { createChartElement, DEFAULT_FRAMES, stackBelow } from "../defaults";
import type { ChartElement, ChartSeries } from "../types";
import type { ToolArgs } from "./schemas";
import { describeElement, fail, findElement, findSlide, ok, replaceElement, replaceSlide, slideLabel, type Reducer } from "./shared";

function seriesMismatch(categories: string[], series: ChartSeries[]): string | undefined {
  const bad = series.find((s) => s.values.length !== categories.length);
  return bad ? `Series “${bad.name}” has ${bad.values.length} values but there are ${categories.length} categories` : undefined;
}

export const addChart: Reducer<ToolArgs<"add_chart">> = (deck, args) => {
  const found = findSlide(deck, args.slideId);
  if (!found) return fail(`Slide ${args.slideId} not found`);
  const mismatch = seriesMismatch(args.categories, args.series);
  if (mismatch) return fail(mismatch);

  const chart = createChartElement({ ...args, frame: stackBelow(found.slide, args.frame, DEFAULT_FRAMES.chart) });
  const next = replaceSlide(deck, args.slideId, (slide) => ({ ...slide, elements: [...slide.elements, chart] }));
  return ok(next, `Added ${describeElement(chart)} to ${slideLabel(deck, args.slideId)}`, {
    slideId: args.slideId,
    elementId: chart.id,
  });
};

export const updateChartData: Reducer<ToolArgs<"update_chart_data">> = (deck, args) => {
  const found = findSlide(deck, args.slideId);
  if (!found) return fail(`Slide ${args.slideId} not found`);
  const target = findElement(found.slide, args.elementId);
  if (!target) return fail(`Element ${args.elementId} is not on ${slideLabel(deck, args.slideId)}`);
  if (target.element.type !== "chart") return fail(`Element ${args.elementId} is a ${target.element.type}, not a chart`);

  const chart = target.element;
  const categories = args.categories ?? chart.categories;
  const series = args.series ?? chart.series;
  const mismatch = seriesMismatch(categories, series);
  if (mismatch) return fail(mismatch);

  const updated: ChartElement = {
    ...chart,
    title: args.title ?? chart.title,
    categories,
    series,
    options: { ...chart.options, ...args.options },
  };
  const next = replaceSlide(deck, args.slideId, (slide) => replaceElement(slide, args.elementId, () => updated));
  return ok(next, `Updated data on ${describeElement(updated)}`, { slideId: args.slideId, elementId: chart.id });
};

export const changeChartType: Reducer<ToolArgs<"change_chart_type">> = (deck, args) => {
  const found = findSlide(deck, args.slideId);
  if (!found) return fail(`Slide ${args.slideId} not found`);
  const target = findElement(found.slide, args.elementId);
  if (!target) return fail(`Element ${args.elementId} is not on ${slideLabel(deck, args.slideId)}`);
  if (target.element.type !== "chart") return fail(`Element ${args.elementId} is a ${target.element.type}, not a chart`);
  if (target.element.chartType === args.chartType) return fail(`Chart is already a ${args.chartType} chart`);

  const from = target.element.chartType;
  const next = replaceSlide(deck, args.slideId, (slide) =>
    replaceElement(slide, args.elementId, (el) => (el.type === "chart" ? { ...el, chartType: args.chartType } : el)),
  );
  return ok(next, `Changed ${describeElement(target.element)} from ${from} to ${args.chartType}`, {
    slideId: args.slideId,
    elementId: args.elementId,
  });
};
