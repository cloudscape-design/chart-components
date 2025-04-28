// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { warnOnce } from "@cloudscape-design/component-toolkit/internal";
import Box from "@cloudscape-design/components/box";

import { CoreTooltipOptions, Rect } from "../core/interfaces-core";
import { getOptionsId, getPointColor, getPointId, getSeriesMarkerType } from "../core/utils";
import ChartSeriesDetails from "../internal/components/series-details";
import { ChartSeriesMarker } from "../internal/components/series-marker";
import { InternalPieChartOptions, PieChartProps } from "./interfaces-pie";

import styles from "./styles.css.js";

export function useChartTooltipPie(props: {
  options: InternalPieChartOptions;
  tooltip?: PieChartProps.TooltipOptions;
}): CoreTooltipOptions {
  const getTooltipContent: CoreTooltipOptions["getTooltipContent"] = ({ point }) => {
    const tooltipDetails:
      | PieChartProps.TooltipHeaderRenderProps
      | PieChartProps.TooltipBodyRenderProps
      | PieChartProps.TooltipFooterRenderProps = {
      totalValue: point.total ?? 0,
      segmentValue: point.y ?? 0,
      segmentId: getOptionsId(point.options),
      segmentName: point.name ?? "",
    };

    return {
      header: props.tooltip?.header?.(tooltipDetails) ?? (
        <div className={styles["tooltip-default-header"]}>
          <ChartSeriesMarker color={getPointColor(point)} type={getSeriesMarkerType(point.series)} />{" "}
          <Box variant="span" fontWeight="bold">
            {point.name}
          </Box>
        </div>
      ),
      body: props.tooltip?.body?.(tooltipDetails) ?? (
        <ChartSeriesDetails details={[{ key: point.series.name, value: point.y ?? 0 }]} />
      ),
      footer: props.tooltip?.footer?.(tooltipDetails),
    };
  };

  const getTargetFromPoint: CoreTooltipOptions["getTargetFromPoint"] = (point) => {
    const placement = props.tooltip?.placement ?? "target";
    if (placement === "target") {
      return getPieChartTargetPlacement(point);
    } else {
      return getPieMiddlePlacement(point);
    }
  };

  const onPointHighlight: CoreTooltipOptions["onPointHighlight"] = ({ point }) => {
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

function getPieChartTargetPlacement(point: Highcharts.Point): Rect {
  // The pie series segments do not provide plotX, plotY to compute the tooltip placement.
  // Instead, there is a `tooltipPos` tuple, which is not covered by TS.
  if ("tooltipPos" in point && Array.isArray(point.tooltipPos)) {
    return { x: point.tooltipPos[0], y: point.tooltipPos[1], width: 0, height: 0 };
  }
  warnOnce("PieChart", "Failed to get pie chart on-target tooltip position.");
  return getPieMiddlePlacement(point);
}

function getPieMiddlePlacement(point: Highcharts.Point): Rect {
  const chart = point.series.chart;
  const [relativeX, relativeY, relativeDiameter] = point.series.center;
  const plotLeft = chart.plotLeft;
  const plotTop = chart.plotTop;
  const centerX = plotLeft + (typeof relativeX === "number" ? relativeX : (relativeX / 100) * chart.plotWidth);
  const centerY = plotTop + (typeof relativeY === "number" ? relativeY : (relativeY / 100) * chart.plotHeight);
  const radius =
    (typeof relativeDiameter === "number" ? relativeDiameter : (relativeDiameter / 100) * chart.plotWidth) / 2;
  return { x: centerX, y: centerY - radius, width: 1, height: 2 * radius };
}
