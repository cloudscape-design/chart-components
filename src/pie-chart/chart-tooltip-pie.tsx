// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";

import { TooltipContentGetter } from "../core/interfaces-core";
import ChartPopoverFooter from "../internal/components/chart-popover-footer";
import ChartSeriesDetails from "../internal/components/chart-series-details";
import { ChartSeriesMarker } from "../internal/components/chart-series-marker";
import { InternalPieChartOptions, PieChartProps } from "./interfaces-pie";

export function useChartTooltipPie(
  getChart: () => null | Highcharts.Chart,
  props: {
    options: InternalPieChartOptions;
    tooltip?: PieChartProps.TooltipProps;
  },
) {
  const getContent: TooltipContentGetter<undefined> = (point: { x: number; y: number }) => {
    const chart = getChart();
    if (!chart) {
      console.warn("Chart instance is not available.");
      return () => ({ title: null, body: null });
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

    const title = props.tooltip?.title?.(tooltipDetails) ?? (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <ChartSeriesMarker color={matchedPieDatum.color as string} type="circle" />{" "}
        <Box variant="span" fontWeight="bold">
          {matchedPieDatum.name}
        </Box>
      </div>
    );

    const content = props.tooltip?.content?.(tooltipDetails) ?? (
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

    const body =
      (content ?? footer) ? (
        <>
          {content}
          {footer && <ChartPopoverFooter>{footer}</ChartPopoverFooter>}
        </>
      ) : null;

    return () => ({ title, body });
  };

  return { getContent, state: undefined };
}
