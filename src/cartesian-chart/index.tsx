// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef } from "react";

import { BaseCartesianSeriesOptions } from "../core/interfaces-base";
import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import useBaseComponent from "../internal/base-component/use-base-component";
import { applyDisplayName } from "../internal/utils/apply-display-name";
import { getAllowedProps } from "../internal/utils/utils";
import { InternalCartesianChart } from "./chart-cartesian-internal";
import { CartesianChartProps, InternalCartesianChartOptions, isSeriesOptionsWithError } from "./interfaces-cartesian";

/**
 * CartesianChart is a public Cloudscape component. It features a custom API, which resembles the Highcharts API where appropriate,
 * and adds extra features such as additional series types (thresholds), alternative tooltip, no-data, legend, and more.
 */
const CartesianChart = forwardRef(
  ({ verticalAxisTitlePlacement = "top", ...props }: CartesianChartProps, ref: React.Ref<CartesianChartProps.Ref>) => {
    const baseComponentProps = useBaseComponent("CartesianChart", { props: {} });
    return (
      <InternalCartesianChart
        ref={ref}
        highcharts={props.highcharts}
        fallback={props.fallback}
        options={validateOptions(props)}
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
function validateOptions(props: CartesianChartProps): InternalCartesianChartOptions {
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
        marker: {
          enabled: false,
        },
      },
      scatter: {
        marker: {
          enabled: true,
        },
      },
    },
    series: validateSeries(props.series),
    xAxis: props.xAxis ? [validateXAxis(props.xAxis)] : [{}],
    yAxis: props.yAxis ? [validateYAxis(props.yAxis)] : [{}],
  };
}

function validateSeries(
  unvalidatedSeries: CartesianChartProps.SeriesOptions[],
): CartesianChartProps.LegendSeriesOptions[] {
  const validatedSeries: CartesianChartProps.LegendSeriesOptions[] = [];

  const getBaseProps = (s: BaseCartesianSeriesOptions) => ({ id: s.id, name: s.name, color: s.color });
  function getValidatedSeries(s: CartesianChartProps.SeriesOptions): null | CartesianChartProps.LegendSeriesOptions {
    switch (s.type) {
      case "area":
        return { type: s.type, ...getBaseProps(s), data: s.data };
      case "areaspline":
        return { type: s.type, ...getBaseProps(s), data: s.data };
      case "column":
        return { type: s.type, ...getBaseProps(s), data: s.data, error: s.error };
      case "line":
        return { type: s.type, ...getBaseProps(s), data: s.data, error: s.error };
      case "scatter":
        return { type: s.type, ...getBaseProps(s), data: s.data, marker: s.marker || {} };
      case "spline":
        return { type: s.type, ...getBaseProps(s), data: s.data, error: s.error };
      case "x-threshold":
        return { type: s.type, ...getBaseProps(s), value: s.value };
      case "y-threshold":
        return { type: s.type, ...getBaseProps(s), value: s.value };
      default:
        return null;
    }
  }

  for (const series of unvalidatedSeries) {
    const filtered = getValidatedSeries(series);
    if (filtered) {
      validatedSeries.push(filtered);
      if (isSeriesOptionsWithError(filtered) && filtered.error) {
        validatedSeries.push({
          type: "errorbar",
          name: filtered.name + " (error)",
          data: filtered.error,
        });
      }
    }
  }

  return validatedSeries;
}

function validateXAxis(axis: CartesianChartProps.XAxisOptions): CartesianChartProps.XAxisOptions {
  return validateAxis(axis);
}

function validateYAxis(axis: CartesianChartProps.YAxisOptions): CartesianChartProps.YAxisOptions {
  return {
    ...validateAxis(axis),
    reversedStacks: axis.reversedStacks,
  };
}

function validateAxis(
  axis: CartesianChartProps.XAxisOptions | CartesianChartProps.YAxisOptions,
): CartesianChartProps.XAxisOptions | CartesianChartProps.YAxisOptions {
  return {
    type: axis.type,
    title: axis.title,
    min: axis.min,
    max: axis.max,
    tickInterval: axis.tickInterval,
    categories: axis.categories,
    valueFormatter: axis.valueFormatter,
  };
}
