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
import { CartesianChartProps as C, CartesianChartProps } from "./interfaces-cartesian";

export type { CartesianChartProps };

const CartesianChart = forwardRef(
  (
    {
      fitHeight = false,
      inverted = false,
      stacking = false,
      emphasizeBaseline = true,
      verticalAxisTitlePlacement = "top",
      ...props
    }: CartesianChartProps,
    ref: React.Ref<CartesianChartProps.Ref>,
  ) => {
    // We validate series and axes options before propagating them to the internal chart to ensure only those
    // options defined in the component's contract can be propagated down to the underlying Highcharts component.
    // Additionally, we assign all default options, including the nested ones.
    const series = validateSeries(props.series, stacking);
    const xAxis = validateXAxisOptions(props.xAxis);
    const yAxis = validateYAxisOptions(props.yAxis);
    const tooltip = validateTooltip(props.tooltip);
    const legend = validateLegend(props.legend);

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

function validateSeries(unvalidatedSeries: readonly C.SeriesOptions[], stacking: boolean): C.SeriesOptions[] {
  const validatedSeries: C.SeriesOptions[] = [];
  function validateSingleSeries(s: C.SeriesOptions): null | C.SeriesOptions {
    switch (s.type) {
      case "area":
      case "areaspline":
      case "line":
      case "spline":
        return validateLineLikeSeries(s);
      case "column":
        return validateColumnSeries(s);
      case "scatter":
        return validateScatterSeries(s);
      case "errorbar":
        return validateErrorBarSeries(s, unvalidatedSeries, stacking);
      case "x-threshold":
      case "y-threshold":
        return validateThresholdSeries(s);
      default:
        return null;
    }
  }
  for (const series of unvalidatedSeries) {
    const validated = validateSingleSeries(series);
    if (validated) {
      validatedSeries.push(validated);
    }
  }
  return validatedSeries;
}

function validateLineLikeSeries<
  S extends C.AreaSeriesOptions | C.AreaSplineSeriesOptions | C.LineSeriesOptions | C.SplineSeriesOptions,
>(s: S): null | S {
  const data = validatePointData(s.data);
  return { type: s.type, id: s.id, name: s.name, color: s.color, data } as S;
}

function validateColumnSeries<S extends C.ColumnSeriesOptions>(s: S): null | S {
  const data = validatePointData(s.data);
  return { type: s.type, id: s.id, name: s.name, color: s.color, data } as S;
}

function validateScatterSeries<S extends C.ScatterSeriesOptions>(s: S): null | S {
  const data = validatePointData(s.data);
  const marker = s.marker ?? {};
  return { type: s.type, id: s.id, name: s.name, color: s.color, data, marker } as S;
}

function validateThresholdSeries<S extends C.XThresholdSeriesOptions | C.YThresholdSeriesOptions>(s: S): null | S {
  return { type: s.type, id: s.id, name: s.name, color: s.color, value: s.value } as S;
}

function validateErrorBarSeries(
  series: C.ErrorBarSeriesOptions,
  allSeries: readonly C.SeriesOptions[],
  stacking: boolean,
): null | C.ErrorBarSeriesOptions {
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
  const data = validateRangeData(series.data);
  return { type: series.type, id: series.id, name: series.name, color: series.color, linkedTo: series.linkedTo, data };
}

function validatePointData(data: readonly PointDataItemType[]): readonly PointDataItemType[] {
  return data.map((d) => (d && typeof d === "object" ? { x: d.x, y: d.y } : d));
}

function validateRangeData(data: readonly RangeDataItemOptions[]): readonly RangeDataItemOptions[] {
  return data.map((d) => ({ x: d.x, low: d.low, high: d.high }));
}

function validateXAxisOptions(axis?: C.XAxisOptions): C.XAxisOptions {
  return validateAxisOptions(axis);
}

function validateYAxisOptions(axis?: C.YAxisOptions): C.YAxisOptions {
  return { ...validateAxisOptions(axis), reversedStacks: axis?.reversedStacks };
}

function validateAxisOptions<O extends C.XAxisOptions | C.YAxisOptions>(axis?: O): O {
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

function validateTooltip(tooltip?: C.TooltipOptions): SomeRequired<C.TooltipOptions, "enabled" | "placement" | "size"> {
  return {
    ...tooltip,
    enabled: tooltip?.enabled ?? true,
    placement: tooltip?.placement ?? "middle",
    size: tooltip?.size ?? "medium",
  };
}

function validateLegend(legend?: C.LegendOptions): SomeRequired<C.LegendOptions, "enabled"> {
  return { ...legend, enabled: legend?.enabled ?? true };
}
