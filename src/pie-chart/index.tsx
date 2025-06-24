// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef } from "react";

import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import useBaseComponent from "../internal/base-component/use-base-component";
import { applyDisplayName } from "../internal/utils/apply-display-name";
import { SomeRequired } from "../internal/utils/utils";
import { InternalPieChart } from "./chart-pie-internal";
import { PieChartProps } from "./interfaces";

export type { PieChartProps };

const PieChart = forwardRef(({ fitHeight = false, ...props }: PieChartProps, ref: React.Ref<PieChartProps.Ref>) => {
  // We transform options before propagating them to the internal chart to ensure only those
  // defined in the component's contract can be propagated down to the underlying Highcharts.
  // Additionally, we assign all default options, including the nested ones.
  const series = transformSeries(props.series);
  const tooltip = transformTooltip(props.tooltip);
  const legend = transformLegend(props.legend);

  const baseComponentProps = useBaseComponent("PieChart", { props: { fitHeight } });

  return (
    <InternalPieChart
      ref={ref}
      {...props}
      fitHeight={fitHeight}
      series={series}
      tooltip={tooltip}
      legend={legend}
      {...getDataAttributes(props)}
      {...baseComponentProps}
    />
  );
});

applyDisplayName(PieChart, "PieChart");

export default PieChart;

function transformSeries(series: null | PieChartProps.SeriesOptions): readonly PieChartProps.SeriesOptions[] {
  if (!series) {
    return [];
  }
  switch (series.type) {
    case "pie":
    case "donut":
      return [
        { type: series.type, id: series.id, name: series.name, color: series.color, data: transformData(series.data) },
      ];
  }
}

function transformData(data: readonly PieChartProps.PieSegmentOptions[]): readonly PieChartProps.PieSegmentOptions[] {
  return data.map((d) => ({ id: d.id, name: d.name, color: d.color, y: d.y }));
}

function transformTooltip(
  tooltip?: PieChartProps.TooltipOptions,
): SomeRequired<PieChartProps.TooltipOptions, "enabled" | "size"> {
  return {
    ...tooltip,
    enabled: tooltip?.enabled ?? true,
    size: tooltip?.size ?? "medium",
  };
}

function transformLegend(legend?: PieChartProps.LegendOptions): SomeRequired<PieChartProps.LegendOptions, "enabled"> {
  return { ...legend, enabled: legend?.enabled ?? true };
}
