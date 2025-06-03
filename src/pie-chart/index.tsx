// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef } from "react";

import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import useBaseComponent from "../internal/base-component/use-base-component";
import { applyDisplayName } from "../internal/utils/apply-display-name";
import { getAllowedProps } from "../internal/utils/utils";
import { InternalPieChart } from "./chart-pie-internal";
import { InternalPieChartOptions, PieChartProps } from "./interfaces-pie";

/**
 * PieChart is a public Cloudscape component. It features a custom API, which resembles the Highcharts API where appropriate,
 * and adds extra features such as inner title and description, alternative tooltip, no-data, and more.
 */
const PieChart = forwardRef((props: PieChartProps, ref: React.Ref<PieChartProps.Ref>) => {
  const baseComponentProps = useBaseComponent("PieChart", { props: {} });
  return (
    <InternalPieChart
      ref={ref}
      highcharts={props.highcharts}
      fallback={props.fallback}
      options={validateOptions(props)}
      ariaLabel={props.ariaLabel}
      ariaDescription={props.ariaDescription}
      fitHeight={props.fitHeight}
      chartHeight={props.chartHeight}
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
      filter={getAllowedProps(props.filter)}
      header={getAllowedProps(props.header)}
      footer={getAllowedProps(props.footer)}
      {...getDataAttributes(props)}
      {...baseComponentProps}
    />
  );
});

export type { PieChartProps };

applyDisplayName(PieChart, "PieChart");

export default PieChart;

// We explicitly transform component properties to Highcharts options and internal cartesian chart properties
// to avoid accidental or intentional use of Highcharts features that are not yet supported by Cloudscape.
function validateOptions(props: PieChartProps): InternalPieChartOptions {
  return {
    series: props.series ? validateSeries(props.series) : [],
  };
}

function validateSeries(s: PieChartProps.SeriesOptions): PieChartProps.SeriesOptions[] {
  switch (s.type) {
    case "pie":
      return [{ type: s.type, id: s.id, name: s.name, color: s.color, data: s.data }];
    case "donut":
      return [{ type: s.type, id: s.id, name: s.name, color: s.color, data: s.data }];
  }
}
