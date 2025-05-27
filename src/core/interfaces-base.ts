// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NonCancelableEventHandler } from "../internal/events";

// All charts take `highcharts` instance, that can be served statically or dynamically.
// Although it has to be of type Highcharts, the TS type we use is `null | object`, so
// that it is ignored by the documenter.

/**
 * This interface includes common public chart properties, applicable for all chart types.
 */
export interface BaseChartProps {
  /**
   * The Highcharts instance, that can be obtained as `import Highcharts from 'highcharts'`.
   * Supported Highcharts versions:
   * * `v12`
   */
  highcharts: null | object;

  /**
   * Custom content to be rendered when `highcharts=null`. It defaults to a spinner.
   */
  fallback?: React.ReactNode;

  /**
   * The height of the chart plot in pixels. It does not include legend, filter, header, and footer.
   */
  chartHeight?: number;

  /**
   * When set, the chart grows automatically to fill the parent container.
   */
  fitHeight?: boolean;

  /**
   * Defines the minimal allowed height of the chart plot. Use it when `fitHeight=true`
   * to prevent the chart plot become too small to digest the content of it. If the parent container is
   * too small to satisfy the min width value, the horizontal scrollbar is automatically added.
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
   * Chart legend options.
   */
  legend?: ChartLegendOptions;

  /**
   * The empty, no-match, loading, or error state of the chart.
   * It requires the `no-data-to-display` module.
   */
  noData?: ChartNoDataOptions;

  /**
   * Use header to render custom content above the chart.
   */
  header?: ChartHeaderOptions;

  /**
   * Use header to render custom content below the chart (under the legend if present).
   */
  footer?: ChartFooterOptions;

  /**
   * Use filter to render default series filter, custom series filter, and/or additional filters.
   */
  filter?: ChartFilterOptions;
}

export interface ChartTooltipOptions {
  enabled?: boolean;
  placement?: "middle" | "outside" | "target";
  size?: "small" | "medium" | "large";
}

export interface ChartLegendOptions {
  enabled?: boolean;
  title?: string;
  actions?: React.ReactNode;
}

export interface ChartNoDataOptions {
  statusType?: "finished" | "loading" | "error";
  empty?: React.ReactNode;
  error?: React.ReactNode;
  loading?: React.ReactNode;
  noMatch?: React.ReactNode;
  onRecoveryClick?: NonCancelableEventHandler;
}

export interface ChartHeaderOptions {
  content: React.ReactNode;
}

export interface ChartFooterOptions {
  content: React.ReactNode;
}

export interface ChartLegendItem {
  id: string;
  name: string;
  marker: React.ReactNode;
  visible: boolean;
}

export interface ChartI18nStrings {
  loadingText?: string;
  errorText?: string;
  recoveryText?: string;
  seriesFilterLabel?: string;
  seriesFilterPlaceholder?: string;
  legendAriaLabel?: string;
}

export interface ChartFilterOptions {
  seriesFilter?: boolean;
  additionalFilters?: React.ReactNode;
}

export interface AreaSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "area";
  data: PointDataItemType[];
}

export interface AreaSplineSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "areaspline";
  data: PointDataItemType[];
}

export interface ColumnSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "column";
  data: PointDataItemType[];
}

export interface LineSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "line";
  data: PointDataItemType[];
}

export interface SplineSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "spline";
  data: PointDataItemType[];
}

export interface ScatterSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "scatter";
  data: PointDataItemType[];
  marker?: PointMarkerOptions;
}

export interface ErrorBarSeriesOptions extends BaseCartesianSeriesOptions {
  type: "errorbar";
  data: RangeDataItemType[];
  linkedTo: string;
}

export interface XThresholdSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "x-threshold";
  value: number;
}

export interface YThresholdSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "y-threshold";
  value: number;
}

export interface PieSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "pie";
  data: PieSegmentOptions[];
}

export interface DonutSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "donut";
  data: PieSegmentOptions[];
}

// The data items are simpler versions of Highcharts.PointOptionsObject

export interface PieSegmentOptions {
  y: number | null;
  id?: string;
  name: string;
  color?: string;
}

export type PointDataItemType = null | number | [number, number | null] | PointDataItemOptions;

export type RangeDataItemType = [number, number] | [number, number, number] | RangeDataItemOptions;

export interface PointDataItemOptions {
  x: number;
  y: number | null;
}

export interface RangeDataItemOptions {
  x?: number;
  low: number;
  high: number;
}

export interface BaseCartesianSeriesOptions {
  id?: string;
  name?: string;
  color?: string;
}

export interface BaseCartesianSeriesOptionsWithName extends BaseCartesianSeriesOptions {
  name: string;
}

// The simpler version of Highcharts.PointMarkerOptionsObject
export interface PointMarkerOptions {
  symbol?: "circle" | "diamond" | "square" | "triangle" | "triangle-down";
}
