// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef } from "react";

import { warnOnce } from "@cloudscape-design/component-toolkit/internal";

import { PointDataItemType, RangeDataItemOptions } from "../core/interfaces";
import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import useBaseComponent from "../internal/base-component/use-base-component";
import { applyDisplayName } from "../internal/utils/apply-display-name";
import { SomeRequired } from "../internal/utils/utils";
import { InternalCartesianChart } from "./chart-cartesian-internal";
import { CartesianChartProps } from "./interfaces";

export type { CartesianChartProps };

const CartesianChart = forwardRef(
  (
    {
      fitHeight = false,
      inverted = false,
      stacking = undefined,
      emphasizeBaseline = true,
      verticalAxisTitlePlacement = "top",
      ...props
    }: CartesianChartProps,
    ref: React.Ref<CartesianChartProps.Ref>,
  ) => {
    // We transform options before propagating them to the internal chart to ensure only those
    // defined in the component's contract can be propagated down to the underlying Highcharts.
    // Additionally, we assign all default options, including the nested ones.
    const series = transformSeries(props.series, stacking);
    const xAxis = transformXAxisOptions(props.xAxis);
    const yAxis = transformYAxisOptions(props.yAxis);
    const tooltip = transformTooltip(props.tooltip);
    const legend = transformLegend(props.legend);

    const baseComponentProps = useBaseComponent("CartesianChart", {
      props: { fitHeight, inverted, stacking, emphasizeBaseline, verticalAxisTitlePlacement },
      metadata: {},
    });

    return (
      <InternalCartesianChart
        ref={ref}
        {...props}
        fitHeight={fitHeight}
        inverted={inverted}
        stacking={stacking}
        emphasizeBaseline={emphasizeBaseline}
        verticalAxisTitlePlacement={verticalAxisTitlePlacement}
        series={series}
        xAxis={xAxis}
        yAxis={yAxis}
        tooltip={tooltip}
        legend={legend}
        {...getDataAttributes(props)}
        {...baseComponentProps}
      />
    );
  },
);

applyDisplayName(CartesianChart, "CartesianChart");

export default CartesianChart;

function transformSeries(
  untransformedSeries: readonly CartesianChartProps.SeriesOptions[],
  stacking?: "normal",
): CartesianChartProps.SeriesOptions[] {
  const transformedSeries: CartesianChartProps.SeriesOptions[] = [];
  function transformSingleSeries(s: CartesianChartProps.SeriesOptions): null | CartesianChartProps.SeriesOptions {
    switch (s.type) {
      case "area":
      case "areaspline":
      case "line":
      case "spline":
        return transformLineLikeSeries(s);
      case "column":
        return transformColumnSeries(s);
      case "scatter":
        return transformScatterSeries(s);
      case "errorbar":
        return transformErrorBarSeries(s, untransformedSeries, stacking);
      case "x-threshold":
      case "y-threshold":
        return transformThresholdSeries(s);
      default:
        return null;
    }
  }
  for (const series of untransformedSeries) {
    const transformed = transformSingleSeries(series);
    if (transformed) {
      transformedSeries.push(transformed);
    }
  }
  return transformedSeries;
}

function transformLineLikeSeries<
  S extends
    | CartesianChartProps.AreaSeriesOptions
    | CartesianChartProps.AreaSplineSeriesOptions
    | CartesianChartProps.LineSeriesOptions
    | CartesianChartProps.SplineSeriesOptions,
>(s: S): null | S {
  const data = transformPointData(s.data);
  return { type: s.type, id: s.id, name: s.name, color: s.color, data } as S;
}

function transformColumnSeries<S extends CartesianChartProps.ColumnSeriesOptions>(s: S): null | S {
  const data = transformPointData(s.data);
  return { type: s.type, id: s.id, name: s.name, color: s.color, data } as S;
}

function transformScatterSeries<S extends CartesianChartProps.ScatterSeriesOptions>(s: S): null | S {
  const data = transformPointData(s.data);
  const marker = s.marker ?? {};
  return { type: s.type, id: s.id, name: s.name, color: s.color, data, marker } as S;
}

function transformThresholdSeries<
  S extends CartesianChartProps.XThresholdSeriesOptions | CartesianChartProps.YThresholdSeriesOptions,
>(s: S): null | S {
  return { type: s.type, id: s.id, name: s.name, color: s.color, value: s.value } as S;
}

function transformErrorBarSeries(
  series: CartesianChartProps.ErrorBarSeriesOptions,
  allSeries: readonly CartesianChartProps.SeriesOptions[],
  stacking?: "normal",
): null | CartesianChartProps.ErrorBarSeriesOptions {
  // Highcharts only supports error bars for non-stacked series.
  // See: https://github.com/highcharts/highcharts/issues/23080.
  if (stacking) {
    warnOnce("CartesianChart", "Error bars are not supported for stacked series.");
    return null;
  }
  // We only support error bars that are linked to some other series. It is only possible to link it
  // using series ID (but not name), or by using ":previous" pseudo-selector.
  // See: https://api.highcharts.com/highcharts/series.errorbar.linkedTo.
  const linkedSeries =
    series.linkedTo === ":previous"
      ? allSeries[allSeries.indexOf(series) - 1]
      : allSeries.find(({ id }) => id === series.linkedTo);
  // The non-linked error bars are not supported: those will not appear in our custom legend and tooltip,
  // so we remove them from the series array. We also do not support linking them to other error bars,
  // or our custom threshold series.
  if (!linkedSeries || ["errorbar", "x-threshold", "y-threshold"].includes(linkedSeries.type)) {
    warnOnce(
      "CartesianChart",
      'The `linkedTo` property of "errorbar" series points to a missing, or unsupported series.',
    );
    return null;
  }
  const data = transformRangeData(series.data);
  return { type: series.type, id: series.id, name: series.name, color: series.color, linkedTo: series.linkedTo, data };
}

function transformPointData(data: readonly PointDataItemType[]): readonly PointDataItemType[] {
  return data.map((d) => (d && typeof d === "object" ? { x: d.x, y: d.y } : d));
}

function transformRangeData(data: readonly RangeDataItemOptions[]): readonly RangeDataItemOptions[] {
  return data.map((d) => ({ x: d.x, low: d.low, high: d.high }));
}

function transformXAxisOptions(axis?: CartesianChartProps.XAxisOptions): CartesianChartProps.XAxisOptions {
  return transformAxisOptions(axis);
}

function transformYAxisOptions(axis?: CartesianChartProps.YAxisOptions): CartesianChartProps.YAxisOptions {
  return { ...transformAxisOptions(axis), reversedStacks: axis?.reversedStacks };
}

function transformAxisOptions<O extends CartesianChartProps.XAxisOptions | CartesianChartProps.YAxisOptions>(
  axis?: O,
): O {
  return {
    type: axis?.type,
    title: axis?.title,
    min: axis?.min,
    max: axis?.max,
    tickInterval: axis?.tickInterval,
    categories: axis?.categories,
    valueFormatter: axis?.valueFormatter,
  } as O;
}

function transformTooltip(
  tooltip?: CartesianChartProps.TooltipOptions,
): SomeRequired<CartesianChartProps.TooltipOptions, "enabled" | "placement" | "size"> {
  return {
    ...tooltip,
    enabled: tooltip?.enabled ?? true,
    placement: tooltip?.placement ?? "middle",
    size: tooltip?.size ?? "medium",
  };
}

function transformLegend(
  legend?: CartesianChartProps.LegendOptions,
): SomeRequired<CartesianChartProps.LegendOptions, "enabled"> {
  return { ...legend, enabled: legend?.enabled ?? true };
}
