// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useMemo } from "react";

import { warnOnce } from "@cloudscape-design/component-toolkit/internal";

import { BaseCartesianSeriesOptions } from "../core/interfaces-base";
import { InternalXAxisOptions, InternalYAxisOptions } from "../core/interfaces-core";
import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import useBaseComponent from "../internal/base-component/use-base-component";
import { applyDisplayName } from "../internal/utils/apply-display-name";
import { getAllowedProps } from "../internal/utils/utils";
import { InternalCartesianChart } from "./chart-cartesian-internal";
import { CartesianChartProps, InternalCartesianChartOptions, InternalSeriesOptions } from "./interfaces-cartesian";

/**
 * CartesianChart is a public Cloudscape component. It features a custom API, which resembles the Highcharts API where appropriate,
 * and adds extra features such as additional series types (thresholds), alternative tooltip, no-data, legend, and more.
 */
const CartesianChart = forwardRef(
  ({ verticalAxisTitlePlacement = "top", ...props }: CartesianChartProps, ref: React.Ref<CartesianChartProps.Ref>) => {
    const baseComponentProps = useBaseComponent("CartesianChart", { props: {} });
    const validatedOptions = useValidatedOptions(props);
    return (
      <InternalCartesianChart
        ref={ref}
        highcharts={props.highcharts}
        fallback={props.fallback}
        options={validatedOptions}
        fitHeight={props.fitHeight}
        chartHeight={props.chartHeight}
        chartMinHeight={props.chartMinHeight}
        chartMinWidth={props.chartMinWidth}
        noData={getAllowedProps(props.noData)}
        tooltip={getAllowedProps(props.tooltip)}
        legend={getAllowedProps(props.legend)}
        visibleSeries={props.visibleSeries}
        onChangeVisibleSeries={props.onChangeVisibleSeries}
        emphasizeBaselineAxis={props.emphasizeBaselineAxis ?? true}
        verticalAxisTitlePlacement={verticalAxisTitlePlacement}
        header={getAllowedProps(props.header)}
        footer={getAllowedProps(props.footer)}
        {...getDataAttributes(props)}
        {...baseComponentProps}
      />
    );
  },
);

export type { CartesianChartProps };

applyDisplayName(CartesianChart, "CartesianChart");

export default CartesianChart;

// We explicitly transform component properties to Highcharts options and internal cartesian chart properties
// to avoid accidental or intentional use of Highcharts features that are not yet supported by Cloudscape.
function useValidatedOptions(props: CartesianChartProps): InternalCartesianChartOptions {
  const validatedSeries = useMemo(() => validateSeries(props.series, props.stacked), [props.series, props.stacked]);
  return {
    chart: {
      inverted: props.inverted,
    },
    accessibility: {
      description: props.ariaDescription,
    },
    lang: {
      accessibility: {
        chartContainerLabel: props.ariaLabel,
      },
    },
    plotOptions: {
      series: {
        stacking: props.stacked ? "normal" : undefined,
      },
    },
    series: validatedSeries,
    xAxis: props.xAxis ? [validateXAxis(props.xAxis)] : [{}],
    yAxis: props.yAxis ? [validateYAxis(props.yAxis)] : [{}],
  };
}

function validateSeries(
  unvalidatedSeries: CartesianChartProps.SeriesOptions[],
  stacked?: boolean,
): CartesianChartProps.SeriesOptions[] {
  const validatedSeries: CartesianChartProps.SeriesOptions[] = [];

  function getValidatedSeries(s: CartesianChartProps.SeriesOptions): null | CartesianChartProps.SeriesOptions {
    const getBaseProps = (s: BaseCartesianSeriesOptions) => ({ id: s.id, name: s.name, color: s.color });
    switch (s.type) {
      case "area":
        return { type: s.type, ...getBaseProps(s), data: s.data } as CartesianChartProps.AreaSeriesOptions;
      case "areaspline":
        return { type: s.type, ...getBaseProps(s), data: s.data } as CartesianChartProps.AreaSplineSeriesOptions;
      case "column":
        return { type: s.type, ...getBaseProps(s), data: s.data } as CartesianChartProps.ColumnSeriesOptions;
      case "errorbar":
        validateErrorBarSeries({ series: s, allSeries: unvalidatedSeries, stacked });
        return {
          type: s.type,
          ...getBaseProps(s),
          data: s.data,
          linkedTo: s.linkedTo,
        } as CartesianChartProps.ErrorBarSeriesOptions;
      case "line":
        return { type: s.type, ...getBaseProps(s), data: s.data } as CartesianChartProps.LineSeriesOptions;
      case "scatter":
        return {
          type: s.type,
          ...getBaseProps(s),
          data: s.data,
          marker: s.marker || {},
        } as CartesianChartProps.ScatterSeriesOptions;
      case "spline":
        return { type: s.type, ...getBaseProps(s), data: s.data } as CartesianChartProps.SplineSeriesOptions;
      case "x-threshold":
        return { type: s.type, ...getBaseProps(s), value: s.value } as CartesianChartProps.XThresholdSeriesOptions;
      case "y-threshold":
        return { type: s.type, ...getBaseProps(s), value: s.value } as CartesianChartProps.YThresholdSeriesOptions;
      default:
        return null;
    }
  }

  for (const series of unvalidatedSeries) {
    const filtered = getValidatedSeries(series);
    if (filtered) {
      validatedSeries.push(filtered);
    }
  }

  return validatedSeries;
}

function validateErrorBarSeries({
  series,
  allSeries,
  stacked,
}: {
  series: CartesianChartProps.ErrorBarSeriesOptions;
  allSeries: CartesianChartProps.SeriesOptions[];
  stacked?: boolean;
}) {
  let previousSeries: CartesianChartProps.SeriesOptions | undefined;
  let foundLinkingSeries = false;
  const seriesDict = new Map<string, InternalSeriesOptions>();
  for (const s of allSeries) {
    if (s === series) {
      foundLinkingSeries = true;
    }
    if (!foundLinkingSeries) {
      previousSeries = s;
    }
    if (s.id !== undefined) {
      seriesDict.set(s.id, s);
    }
  }
  let linkedSeries = seriesDict.get(series.linkedTo);
  if (!linkedSeries && series.linkedTo === ":previous") {
    linkedSeries = previousSeries;
  }
  if (!linkedSeries) {
    warnOnce("CartesianChart", 'Could not find the series that a series of type "errorbar" is linked to.');
    return;
  }
  if (!seriesTypesThatSupportErrorBars.includes(linkedSeries.type)) {
    warnOnce("CartesianChart", `Error bars are not supported for series of type "${linkedSeries.type}".`);
  }
  if (linkedSeries.type === "column" && stacked) {
    warnOnce("CartesianChart", "Error bars are not supported for stacked columns");
  }
}

const seriesTypesThatSupportErrorBars = ["column", "line", "spline"];

function validateXAxis(axis: CartesianChartProps.XAxisOptions): InternalXAxisOptions {
  return {
    type: axis.type,
    title: { text: axis.title },
    min: axis.min,
    max: axis.max,
    tickInterval: axis.tickInterval,
    categories: axis.categories,
    valueFormatter: axis.valueFormatter,
  };
}

function validateYAxis(axis: CartesianChartProps.YAxisOptions): InternalYAxisOptions {
  return {
    type: axis.type,
    title: { text: axis.title },
    min: axis.min,
    max: axis.max,
    tickInterval: axis.tickInterval,
    categories: axis.categories,
    valueFormatter: axis.valueFormatter,
    reversedStacks: axis.reversedStacks,
  };
}
