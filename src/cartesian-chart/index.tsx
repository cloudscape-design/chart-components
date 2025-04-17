// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef } from "react";

import { AbstractSeries } from "../core/interfaces-base";
import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { getAllowedProps } from "../internal/utils/utils";
import { InternalCartesianChart } from "./chart-cartesian-internal";
import { CartesianChartProps, InternalCartesianChartOptions } from "./interfaces-cartesian";

/**
 * CartesianChart is a public Cloudscape component. It features a custom API, which resembles the Highcharts API where appropriate,
 * and adds extra features such as additional series types (thresholds), alternative tooltip, no-data, and more.
 */
const CartesianChart = forwardRef((props: CartesianChartProps, ref: React.Ref<CartesianChartProps.Ref>) => {
  return (
    <InternalCartesianChart
      ref={ref}
      highcharts={props.highcharts}
      options={validateOptions(props)}
      fitHeight={props.fitHeight}
      chartMinHeight={props.chartMinHeight}
      chartMinWidth={props.chartMinWidth}
      noData={getAllowedProps(props.noData)}
      tooltip={getAllowedProps(props.tooltip)}
      legend={getAllowedProps(props.legend)}
      visibleSeries={props.visibleSeries}
      onToggleVisibleSeries={props.onToggleVisibleSeries}
      emphasizeBaselineAxis={props.emphasizeBaselineAxis ?? true}
      verticalAxisTitlePlacement={props.verticalAxisTitlePlacement}
      {...getDataAttributes(props)}
    />
  );
});

export type { CartesianChartProps };

export default CartesianChart;

// We explicitly transform component properties to Highcharts options and internal cartesian chart properties
// to avoid accidental or intentional use of Highcharts features that are not yet supported by Cloudscape.
function validateOptions(props: CartesianChartProps): InternalCartesianChartOptions {
  return {
    chart: {
      height: props.chartHeight,
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
        stacking: props.plotOptions?.series?.stacking,
        marker: {
          enabled: false,
        },
      },
    },
    colors: props.colors,
    series: validateSeries(props.series),
    xAxis: props.xAxis ? [validateXAxis(props.xAxis)] : [],
    yAxis: props.yAxis ? [validateYAxis(props.yAxis)] : [],
  };
}

function validateSeries(unvalidatedSeries: CartesianChartProps.Series[]): CartesianChartProps.Series[] {
  const validatedSeries: CartesianChartProps.Series[] = [];

  function getValidatedSeries(s: CartesianChartProps.Series): null | CartesianChartProps.Series {
    const getBaseProps = (s: AbstractSeries) => ({ id: s.id, name: s.name, color: s.color });

    switch (s.type) {
      case "area":
        return { type: s.type, ...getBaseProps(s), data: s.data };
      case "areaspline":
        return { type: s.type, ...getBaseProps(s), data: s.data };
      case "column":
        return { type: s.type, ...getBaseProps(s), data: s.data };
      case "errorbar":
        return { type: s.type, ...getBaseProps(s), data: s.data };
      case "line":
        return { type: s.type, ...getBaseProps(s), data: s.data };
      case "scatter":
        return { type: s.type, ...getBaseProps(s), data: s.data };
      case "spline":
        return { type: s.type, ...getBaseProps(s), data: s.data };
      case "awsui-x-threshold":
        return { type: s.type, ...getBaseProps(s), value: s.value };
      case "awsui-y-threshold":
        return { type: s.type, ...getBaseProps(s), value: s.value };
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

function validateXAxis(axis: CartesianChartProps.XAxisProps): CartesianChartProps.XAxisProps {
  return validateAxis(axis);
}

function validateYAxis(axis: CartesianChartProps.YAxisProps): CartesianChartProps.YAxisProps {
  return {
    ...validateAxis(axis),
    reversedStacks: axis.reversedStacks,
  };
}

function validateAxis(axis: CartesianChartProps.AxisProps): CartesianChartProps.AxisProps {
  return {
    type: axis.type,
    title: axis.title,
    min: axis.min,
    max: axis.max,
    tickInterval: axis.tickInterval,
    categories: axis.categories,
    valueFormatter: axis.valueFormatter,
    valueDecimals: axis.valueDecimals,
  };
}
