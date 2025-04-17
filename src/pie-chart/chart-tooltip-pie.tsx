// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import Box from "@cloudscape-design/components/box";

import { CloudscapeChartAPI, CoreTooltipProps } from "../core/interfaces-core";
import { getPointId } from "../core/utils";
import ChartSeriesDetails from "../internal/components/series-details";
import { ChartSeriesMarker } from "../internal/components/series-marker";
import { InternalPieChartOptions, PieChartProps } from "./interfaces-pie";

export function useChartTooltipPie(
  getAPI: () => CloudscapeChartAPI,
  props: {
    options: InternalPieChartOptions;
    tooltip?: PieChartProps.TooltipProps;
  },
): CoreTooltipProps {
  const getMatchedData = (point: Highcharts.Point) => {
    const chart = getAPI().chart;
    const series = props.options.series[0] as undefined | PieChartProps.Series;
    const matchedChartSeries = chart.series.find((s) => (s.userOptions.id ?? s.name) === (series?.id ?? series?.name));
    if (!matchedChartSeries) {
      console.warn("No matching pie series found.");
      return null;
    }
    return matchedChartSeries.data.find((d) => d.index === point.x);
  };

  const getTooltipContent: CoreTooltipProps["getTooltipContent"] = ({ point }) => {
    const matchedPieDatum = getMatchedData(point);
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
            key: matchedPieDatum.series.name,
            value: matchedPieDatum.y ?? 0,
          },
        ]}
      />
    );

    const footer = props.tooltip?.footer?.(tooltipDetails);

    const body = content;

    return { header, body, footer };
  };

  const getTargetFromPoint: CoreTooltipProps["getTargetFromPoint"] = (point) => {
    const api = getAPI();
    const placement = props.tooltip?.placement ?? "target";

    // The pie series segments do not provide plotX, plotY.
    // That's why we use the tooltipPos tuple, which is not covered by Typescript.
    if (placement === "target") {
      return { x: (point as any).tooltipPos[0], y: (point as any).tooltipPos[1], width: 0, height: 0 };
    } else {
      const [relativeX, relativeY, relativeDiameter] = point.series.center;
      const plotLeft = api.chart.plotLeft;
      const plotTop = api.chart.plotTop;
      const centerX = plotLeft + (typeof relativeX === "number" ? relativeX : (relativeX / 100) * api.chart.plotWidth);
      const centerY = plotTop + (typeof relativeY === "number" ? relativeY : (relativeY / 100) * api.chart.plotHeight);
      const radius =
        (typeof relativeDiameter === "number" ? relativeDiameter : (relativeDiameter / 100) * api.chart.plotWidth) / 2;
      return { x: centerX, y: centerY - radius, width: 1, height: 2 * radius };
    }
  };

  const onPointHighlight: CoreTooltipProps["onPointHighlight"] = ({ point }) => {
    return { matchedLegendItems: [getPointId(point)] };
  };

  return {
    getTooltipContent,
    getTargetFromPoint,
    onPointHighlight,
    size: props.tooltip?.size,
    placement: props.tooltip?.placement,
  };
}
