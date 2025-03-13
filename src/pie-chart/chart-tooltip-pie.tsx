// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";

import { TooltipContent } from "../core/interfaces-core";
import ChartSeriesDetails from "../internal/components/series-details";
import { ChartSeriesMarker } from "../internal/components/series-marker";
import { InternalPieChartOptions, PieChartProps } from "./interfaces-pie";

export function useChartTooltipPie(
  getChart: () => null | Highcharts.Chart,
  props: {
    options: InternalPieChartOptions;
    tooltip?: PieChartProps.TooltipProps;
  },
) {
  const getContent = (point: { x: number; y: number }): null | TooltipContent => {
    const chart = getChart();
    if (!chart) {
      console.warn("Chart instance is not available.");
      return null;
    }
    const series = props.options.series[0] as undefined | PieChartProps.Series;
    const matchedChartSeries = chart.series.find((s) => (s.userOptions.id ?? s.name) === (series?.id ?? series?.name));
    if (!matchedChartSeries) {
      console.warn("No matching pie series found.");
      return null;
    }
    const matchedPieDatum = matchedChartSeries.data.find((d) => d.index === point.x);
    if (!matchedPieDatum) {
      console.warn("No matching pie datum found.");
      return null;
    }

    const tooltipDetails: PieChartProps.TooltipDetails = {
      totalValue: matchedPieDatum.total ?? 0,
      segmentValue: matchedPieDatum.y ?? 0,
      segmentId: matchedPieDatum.options.id,
      segmentName: matchedPieDatum.name ?? "",
    };

    const header = props.tooltip?.title?.(tooltipDetails) ?? (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <ChartSeriesMarker color={matchedPieDatum.color as string} type="large-circle" />{" "}
        <Box variant="span" fontWeight="bold">
          {matchedPieDatum.name}
        </Box>
      </div>
    );

    const content = props.tooltip?.body?.(tooltipDetails) ?? (
      <ChartSeriesDetails
        details={[
          {
            key: matchedChartSeries.name,
            value: matchedPieDatum.y ?? 0,
          },
        ]}
      />
    );

    const footer = props.tooltip?.footer?.(tooltipDetails);

    const body = content;

    return { header, body, footer };
  };

  return { getContent };
}
