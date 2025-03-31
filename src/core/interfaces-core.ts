// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { ChartSeriesMarkerStatus } from "../internal/components/series-marker";
import { BaseLegendProps, BaseNoDataProps, BaseTooltipProps, Point } from "./interfaces-base";

export interface CloudscapeHighchartsProps {
  highcharts: null | typeof Highcharts;
  options: Highcharts.Options;
  tooltip?: CoreTooltipProps;
  legend?: CoreLegendProps;
  noData?: CoreNoDataProps;
  fallback?: React.ReactNode;
  callback?: (chart: CloudscapeChartAPI) => void;
  hiddenItems?: string[];
  onLegendItemToggle?: (seriesOrItemId: string, visible: boolean) => void;
  onLegendItemShowOnly?: (seriesOrItemId: string) => void;
  onLegendItemShowAll?: () => void;
  className?: string;
}

export interface CloudscapeChartAPI {
  hc: Highcharts.Chart;
  cloudscape: {
    highlightPoint(point: Highcharts.Point): void;
    clearHighlight(): void;
  };
}

export interface CoreTooltipProps extends BaseTooltipProps {
  getContent: (point: Point) => null | CoreTooltipContent;
}

export interface CoreLegendProps extends BaseLegendProps {
  getItemStatus?: (seriesOrItemId: string) => ChartSeriesMarkerStatus;
}

export type CoreNoDataProps = BaseNoDataProps;

export interface CoreTooltipContent {
  header: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
}
