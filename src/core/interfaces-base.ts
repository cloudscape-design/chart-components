// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { NonCancelableEventHandler } from "../internal/events";

export interface BaseChartProps {
  /**
   * The Highcharts instance, that can be obtained as `import Highcharts from 'highcharts'`.
   * Supported Highcharts versions:
   * * `v12`
   */
  highcharts: null | typeof Highcharts;

  /**
   * The chart hight in pixels, it includes chart plot, labels, and legend.
   * This property corresponds to [chart.height](https://api.highcharts.com/highcharts/chart.height).
   */
  chartHeight?: number;

  /**
   * When set, the chart grows automatically to fill the parent container.
   */
  fitHeight?: boolean;

  /**
   * Defines the minimal allowed height of the chart plot. If the parent container is too small to satisfy the min
   * height value, the vertical scrollbar is automatically added.
   */
  chartMinHeight?: number;

  /**
   * Defines the minimal allowed width of the chart plot. If the parent container is too small to satisfy the min
   * width value, the horizontal scrollbar is automatically added.
   */
  chartMinWidth?: number;

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
   * An array of default series colors. Only use it when you want to override the Cloudscape-provided set of colors.
   * This property corresponds to [colors](https://api.highcharts.com/highcharts/colors).
   */
  colors?: string[];

  /**
   * Chart tooltip props.
   */
  tooltip?: BaseTooltipProps;

  /**
   * Chart series legend props.
   */
  legend?: BaseLegendProps;

  /**
   * The empty, no-match, loading, or error state of the chart, rendered as [chart.noData](https://api.highcharts.com/highcharts/noData).
   * This property requires the `no-data-to-display` module.
   */
  noData?: BaseNoDataProps;
}

export interface BaseTooltipProps {
  enabled?: boolean;
  placement?: "target" | "bottom";
  size?: "small" | "medium" | "large";
}

export interface BaseLegendProps {
  enabled?: boolean;
  title?: string;
  align?: "start" | "center";
  extendedActions?: boolean;
  tooltip?: {
    render: (itemId: string) => {
      header: React.ReactNode;
      body: React.ReactNode;
      footer?: React.ReactNode;
    };
  };
}

export interface BaseNoDataProps {
  statusType?: "finished" | "loading" | "error";
  empty?: React.ReactNode;
  error?: React.ReactNode;
  loading?: React.ReactNode;
  noMatch?: React.ReactNode;
  onRecoveryClick?: NonCancelableEventHandler;
}

export interface BaseI18nStrings {
  loadingText?: string;
  errorText?: string;
  recoveryText?: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface AreaSeries extends AbstractSeries {
  type: "area";
  data: (number | [number, number] | PointDataItem)[];
  marker?: PointMarker;
}

export interface AreaSplineSeries extends AbstractSeries {
  type: "areaspline";
  data: (number | [number, number] | PointDataItem)[];
  marker?: PointMarker;
}

export interface ColumnSeries extends AbstractSeries {
  type: "column";
  data: (null | number | [number, number | null] | PointDataItem)[];
}

export interface ErrorBarSeries extends AbstractSeries {
  type: "errorbar";
  data: ([number, number] | [number, number, number] | RangeDataItem)[];
}

export interface LineSeries extends AbstractSeries {
  type: "line";
  data: (number | [number, number] | PointDataItem)[];
  marker?: PointMarker;
}

export interface PieSeries extends AbstractSeries {
  type: "pie";
  innerSize?: string;
  data: PieDataItem[];
}

export interface DonutSeries extends AbstractSeries {
  type: "awsui-donut";
  data: PieDataItem[];
}

export interface ScatterSeries extends AbstractSeries {
  type: "scatter";
  data: (number | [number, number] | PointDataItem)[];
  marker?: PointMarker;
}

export interface SplineSeries extends AbstractSeries {
  type: "spline";
  data: (number | [number, number] | PointDataItem)[];
  marker?: PointMarker;
}

export interface TreeMapSeries extends AbstractSeries {
  type: "treemap";
  data: (number | TreeMapDataItem)[];
}

export interface XThresholdSeries extends AbstractSeries {
  type: "awsui-x-threshold";
  value: number;
  proximity?: number;
}

export interface YThresholdSeries extends AbstractSeries {
  type: "awsui-y-threshold";
  value: number;
}

// The data items are simpler versions of Highcharts.PointOptionsObject

export interface PieDataItem {
  y: number | null;
  id?: string;
  name: string;
  color?: string;
}

export interface PointDataItem {
  x: number;
  y: number;
  id?: string;
  name?: string;
  color?: string;
}

export interface RangeDataItem {
  x?: number;
  low: number;
  high: number;
  id?: string;
  name?: string;
  color?: string;
}

export interface TreeMapDataItem {
  value: number;
  id?: string;
  name: string;
  color?: string;
}

export interface AbstractSeries {
  id?: string;
  name: string;
  color?: string;
}

// The simpler version of Highcharts.PointMarkerOptionsObject
export interface PointMarker {
  color?: string;
  enabled?: boolean;
  enabledThreshold?: number;
  height?: number;
  width?: number;
  symbol?: "arc" | "callout" | "circle" | "diamond" | "square" | "triangle" | "triangle-down";
}
