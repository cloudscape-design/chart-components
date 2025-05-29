// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Box from "@cloudscape-design/components/box";

import { CoreChartProps } from "../core/interfaces-core";
import { getOptionsId, getPointColor, getSeriesMarkerType } from "../core/utils";
import ChartSeriesDetails from "../internal/components/series-details";
import { ChartSeriesMarker } from "../internal/components/series-marker";
import { PieChartProps } from "./interfaces-pie";

import styles from "./styles.css.js";

export function useChartTooltipPie(props: { tooltip?: PieChartProps.TooltipOptions }): Partial<CoreChartProps> {
  const getTooltipContent: CoreChartProps["getTooltipContent"] = ({ point }) => {
    if (!point) {
      return null;
    }

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

  return { getTooltipContent };
}
