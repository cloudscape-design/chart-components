// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { ChartSeriesMarkerStatus } from "../internal/components/series-marker";

export interface CloudscapeHighchartsBase {
  /**
   * The Highcharts instance, that can be obtained as `import Highcharts from 'highcharts'`.
   * Supported Highcharts versions:
   * * `v12`
   */
  highcharts: null | typeof Highcharts;

  /**
   * ARIA label of the chart container.
   * This property corresponds to [lang.chartContainerLabel](https://api.highcharts.com/highcharts/lang.accessibility.chartContainerLabel),
   * and requires the [accessibility module](https://www.highcharts.com/docs/accessibility/accessibility-module).
   */
  ariaLabel?: string;

  /**
   * ARIA description of the chart.
   * This property corresponds to [accessibility.description](https://api.highcharts.com/highcharts/accessibility.description),
   * and requires the [accessibility module](https://www.highcharts.com/docs/accessibility/accessibility-module).
   */
  ariaDescription?: string;

  /**
   * The chart hight in pixels, it includes chart plot, labels, and legend.
   * This property corresponds to [chart.height](https://api.highcharts.com/highcharts/chart.height).
   */
  height?: number;

  /**
   * The chart container scrollable area. Either min height or min width can be used, but not both at the same time.
   * This property corresponds to [chart.scrollablePlotArea](https://api.highcharts.com/highcharts/chart.scrollablePlotArea).
   */
  scrollablePlotArea?: {
    minHeight?: number;
    minWidth?: number;
  };

  /**
   * An array of default series colors. Only use it when you want to override the Cloudscape-provided set of colors.
   * This property corresponds to [colors](https://api.highcharts.com/highcharts/colors).
   */
  colors?: string[];

  /**
   * Chart series legend that corresponds to [legend](https://api.highcharts.com/highcharts/legend).
   * The legend is enabled by default.
   * The legend is interactive: clicking on legend items hides/shows the respective chart elements.
   */
  legend?: {
    enabled?: boolean;
    title?: string;
  };

  /**
   * The empty, no-match, loading, or error state of the chart, rendered as [chart.noData](https://api.highcharts.com/highcharts/noData).
   * This property requires the `no-data-to-display` module.
   */
  noData?: ChartNoDataProps;
}

export interface CloudscapeHighchartsProps {
  highcharts: null | typeof Highcharts;
  options: Highcharts.Options;
  tooltip?: TooltipProps;
  legendTooltip?: LegendTooltipProps;
  noData?: ChartNoDataProps;
  legendMarkers?: LegendMarkersProps;
  fallback?: React.ReactNode;
  callback?: (chart: Highcharts.Chart) => void;
  hiddenSeries?: string[];
  onLegendSeriesClick?: (seriesId: string, visible: boolean) => void | boolean;
  hiddenItems?: string[];
  onLegendItemClick?: (itemId: string, visible: boolean) => void | boolean;
  className?: string;
}

export interface TooltipProps {
  getContent: (point: Point) => null | TooltipContent;
}

export interface LegendTooltipProps {
  getContent: (legendItemId: string) => null | TooltipContent;
}

export interface TooltipContent {
  header: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
}

export interface Point {
  x: number;
  y: number;
}

export interface ChartNoDataProps {
  statusType?: "finished" | "loading" | "error";
  empty?: React.ReactNode;
  error?: React.ReactNode;
  loading?: React.ReactNode;
  noMatch?: React.ReactNode;
}

export interface LegendMarkersProps {
  getItemStatus?: (itemId: string) => ChartSeriesMarkerStatus;
}
