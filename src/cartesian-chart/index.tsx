// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef } from "react";

import { warnOnce } from "@cloudscape-design/component-toolkit/internal";

import { PointDataItemType, RangeDataItemOptions, SizePointDataItemOptions } from "../core/interfaces";
import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import useBaseComponent from "../internal/base-component/use-base-component";
import { applyDisplayName } from "../internal/utils/apply-display-name";
import { castArray, SomeRequired } from "../internal/utils/utils";
import { InternalCartesianChart } from "./chart-cartesian-internal";
import { CartesianChartProps } from "./interfaces";
import { getMasterSeries, isErrorBar, isThreshold } from "./utils";

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
    const sizeAxis = transformSizeAxisOptions(props.sizeAxis);
    const tooltip = transformTooltip(props.tooltip);
    const legend = transformLegend(props.legend);

    const baseComponentProps = useBaseComponent("CartesianHighcharts", {
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
        sizeAxis={sizeAxis}
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
        return transformLineLikeSeries(s, untransformedSeries);
      case "column":
        return transformColumnSeries(s, untransformedSeries);
      case "scatter":
        return transformScatterSeries(s, untransformedSeries);
      case "bubble":
        return transformBubbleSeries(s, untransformedSeries);
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

function validateLinkedTo(
  series: CartesianChartProps.SeriesOptions,
  allSeries: readonly CartesianChartProps.SeriesOptions[],
): boolean {
  if (isThreshold(series) || series.linkedTo === undefined) {
    return true;
  }
  // The incorrectly linked series will not appear in our custom legend and tooltip, so we remove them
  // from the series array. We also do not support linking series to errorbar or threshold series.
  const masterSeries = getMasterSeries(allSeries, series);
  if (!masterSeries || isErrorBar(masterSeries) || isThreshold(masterSeries)) {
    warnOnce("CartesianChart", "The `linkedTo` property points to a missing or unsupported series.");
    return false;
  }
  return true;
}

function transformLineLikeSeries<
  S extends
    | CartesianChartProps.AreaSeriesOptions
    | CartesianChartProps.AreaSplineSeriesOptions
    | CartesianChartProps.LineSeriesOptions
    | CartesianChartProps.SplineSeriesOptions,
>(s: S, allSeries: readonly CartesianChartProps.SeriesOptions[]): null | S {
  if (!validateLinkedTo(s, allSeries)) {
    return null;
  }
  const data = transformPointData(s.data);
  return {
    type: s.type,
    id: s.id,
    name: s.name,
    color: s.color,
    dashStyle: s.dashStyle,
    linkedTo: s.linkedTo,
    data,
  } as S;
}

function transformColumnSeries<S extends CartesianChartProps.ColumnSeriesOptions>(
  s: S,
  allSeries: readonly CartesianChartProps.SeriesOptions[],
): null | S {
  if (!validateLinkedTo(s, allSeries)) {
    return null;
  }
  const data = transformPointData(s.data);
  return { type: s.type, id: s.id, name: s.name, color: s.color, linkedTo: s.linkedTo, data } as S;
}

function transformScatterSeries<S extends CartesianChartProps.ScatterSeriesOptions>(
  s: S,
  allSeries: readonly CartesianChartProps.SeriesOptions[],
): null | S {
  if (!validateLinkedTo(s, allSeries)) {
    return null;
  }
  const data = transformPointData(s.data);
  const marker = s.marker ?? {};
  return { type: s.type, id: s.id, name: s.name, color: s.color, linkedTo: s.linkedTo, data, marker } as S;
}

function transformBubbleSeries<S extends CartesianChartProps.BubbleSeriesOptions>(
  s: S,
  allSeries: readonly CartesianChartProps.SeriesOptions[],
): null | S {
  if (!validateLinkedTo(s, allSeries)) {
    return null;
  }
  const data = transformBubbleData(s.data);
  return { type: s.type, id: s.id, name: s.name, color: s.color, data, sizeAxis: s.sizeAxis } as S;
}

function transformThresholdSeries<
  S extends CartesianChartProps.XThresholdSeriesOptions | CartesianChartProps.YThresholdSeriesOptions,
>(s: S): null | S {
  return {
    type: s.type,
    id: s.id,
    name: s.name,
    color: s.color,
    value: s.value,
    dashStyle: s.dashStyle,
  } as S;
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
  // We only support error bars that are linked to some other series.
  if (!validateLinkedTo(series, allSeries)) {
    return null;
  }
  const data = transformRangeData(series.data);
  return { type: series.type, id: series.id, name: series.name, color: series.color, linkedTo: series.linkedTo, data };
}

function transformPointData(data: readonly PointDataItemType[]): readonly PointDataItemType[] {
  return data.map((d) => (d && typeof d === "object" ? { x: d.x, y: d.y } : d));
}

function transformBubbleData(data: readonly SizePointDataItemOptions[]): readonly SizePointDataItemOptions[] {
  return data.map((d) => ({ x: d.x, y: d.y, size: d.size }));
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

function transformSizeAxisOptions(
  axis?: CartesianChartProps.SizeAxisOptions | readonly CartesianChartProps.SizeAxisOptions[],
): undefined | CartesianChartProps.SizeAxisOptions[] {
  return castArray(axis as CartesianChartProps.SizeAxisOptions[])?.map((a) => ({
    id: a.id,
    title: a.title,
    valueFormatter: a.valueFormatter,
  }));
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
