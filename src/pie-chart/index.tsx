// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef } from "react";

import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { getAllowedProps } from "../internal/utils/utils";
import { InternalPieChart } from "./chart-pie-internal";
import { InternalPieChartOptions, PieChartProps } from "./interfaces-pie";

/**
 * PieChart is a public Cloudscape component. It features a custom API, which resembles the Highcharts API where appropriate,
 * and adds extra features such as inner title and description, alternative tooltip, no-data, and more.
 */
export const PieChart = forwardRef((props: PieChartProps, ref: React.Ref<PieChartProps.Ref>) => {
  return (
    <InternalPieChart
      ref={ref}
      highcharts={props.highcharts}
      options={validateOptions(props)}
      fitHeight={props.fitHeight}
      chartMinHeight={props.chartMinHeight}
      chartMinWidth={props.chartMinWidth}
      tooltip={getAllowedProps(props.tooltip)}
      legend={getAllowedProps(props.legend)}
      segmentOptions={getAllowedProps(props.segmentOptions)}
      noData={getAllowedProps(props.noData)}
      visibleSegments={props.visibleSegments}
      onChangeVisibleSegments={props.onChangeVisibleSegments}
      innerValue={props.innerValue}
      innerDescription={props.innerDescription}
      {...getDataAttributes(props)}
    />
  );
});

export type { PieChartProps };

export default PieChart;

// We explicitly transform component properties to Highcharts options and internal cartesian chart properties
// to avoid accidental or intentional use of Highcharts features that are not yet supported by Cloudscape.
function validateOptions(props: PieChartProps): InternalPieChartOptions {
  return {
    chart: {
      height: props.chartHeight,
    },
    accessibility: {
      description: props.ariaDescription,
    },
    lang: {
      accessibility: {
        chartContainerLabel: props.ariaLabel,
      },
    },
    colors: props.colors,
    series: props.series ? validateSeries(props.series) : [],
  };
}

function validateSeries(s: PieChartProps.Series): PieChartProps.Series[] {
  switch (s.type) {
    case "pie":
      return [{ type: s.type, id: s.id, name: s.name, color: s.color, innerSize: s.innerSize, data: s.data }];
    case "awsui-donut":
      return [{ type: s.type, id: s.id, name: s.name, color: s.color, data: s.data }];
    default:
      return [];
  }
}
