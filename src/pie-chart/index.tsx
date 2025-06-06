// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef } from "react";

import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import useBaseComponent from "../internal/base-component/use-base-component";
import { applyDisplayName } from "../internal/utils/apply-display-name";
import { SomeRequired } from "../internal/utils/utils";
import { InternalPieChart } from "./chart-pie-internal";
import { PieChartProps as P, PieChartProps } from "./interfaces";

export type { PieChartProps };

const PieChart = forwardRef(({ fitHeight = false, ...props }: PieChartProps, ref: React.Ref<PieChartProps.Ref>) => {
  // We validate options before propagating them to the internal chart to ensure only those
  // defined in the component's contract can be propagated down to the underlying Highcharts.
  // Additionally, we assign all default options, including the nested ones.
  const series = validateSeries(props.series);
  const tooltip = validateTooltip(props.tooltip);
  const legend = validateLegend(props.legend);

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

function validateSeries(s: null | P.SeriesOptions): readonly P.SeriesOptions[] {
  if (!s) {
    return [];
  }
  switch (s.type) {
    case "pie":
    case "donut":
      return [{ type: s.type, id: s.id, name: s.name, color: s.color, data: validateData(s.data) }];
  }
}

function validateData(data: readonly P.PieSegmentOptions[]): readonly P.PieSegmentOptions[] {
  return data.map((d) => ({ id: d.id, name: d.name, color: d.color, y: d.y }));
}

function validateTooltip(tooltip?: P.TooltipOptions): SomeRequired<P.TooltipOptions, "enabled" | "size"> {
  return {
    ...tooltip,
    enabled: tooltip?.enabled ?? true,
    size: tooltip?.size ?? "medium",
  };
}

function validateLegend(legend?: P.LegendOptions): SomeRequired<P.LegendOptions, "enabled"> {
  return { ...legend, enabled: legend?.enabled ?? true };
}
