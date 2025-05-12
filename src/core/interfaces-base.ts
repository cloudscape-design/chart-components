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
   * An array of default series colors. Only use it when you want to override the Cloudscape-provided set of colors.
   */
  colors?: string[];

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
  placement?: "target" | "middle" | "outside";
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
}

export interface ChartFilterOptions {
  seriesFilter?: boolean;
  additionalFilters?: React.ReactNode;
}

export interface AreaSeriesOptions extends AbstractSeriesOptions {
  type: "area";
  data: (number | [number, number] | PointDataItemOptions)[];
  marker?: PointMarkerOptions;
}

export interface AreaSplineSeriesOptions extends AbstractSeriesOptions {
  type: "areaspline";
  data: (number | [number, number] | PointDataItemOptions)[];
  marker?: PointMarkerOptions;
}

export interface ColumnSeriesOptions extends AbstractSeriesOptions {
  type: "column";
  data: (null | number | [number, number | null] | PointDataItemOptions)[];
}

export interface ErrorBarSeriesOptions extends AbstractSeriesOptions {
  type: "errorbar";
  data: ([number, number] | [number, number, number] | RangeDataItemOptions)[];
}

export interface LineSeriesOptions extends AbstractSeriesOptions {
  type: "line";
  data: (number | [number, number] | PointDataItemOptions)[];
  marker?: PointMarkerOptions;
}

export interface PieSeriesOptions extends AbstractSeriesOptions {
  type: "pie";
  innerSize?: string;
  data: PieDataItemOptions[];
}

export interface DonutSeriesOptions extends AbstractSeriesOptions {
  type: "donut";
  data: PieDataItemOptions[];
}

export interface ScatterSeriesOptions extends AbstractSeriesOptions {
  type: "scatter";
  data: (number | [number, number] | PointDataItemOptions)[];
  marker?: PointMarkerOptions;
}

export interface SplineSeriesOptions extends AbstractSeriesOptions {
  type: "spline";
  data: (number | [number, number] | PointDataItemOptions)[];
  marker?: PointMarkerOptions;
}

export interface TreeMapSeriesOptions extends AbstractSeriesOptions {
  type: "treemap";
  data: (number | TreeMapDataItemOptions)[];
}

export interface XThresholdSeriesOptions extends AbstractSeriesOptions {
  type: "x-threshold";
  value: number;
}

export interface YThresholdSeriesOptions extends AbstractSeriesOptions {
  type: "y-threshold";
  value: number;
}

// The data items are simpler versions of Highcharts.PointOptionsObject

export interface PieDataItemOptions {
  y: number | null;
  id?: string;
  name: string;
  color?: string;
}

export interface PointDataItemOptions {
  x: number;
  y: number;
  id?: string;
  name?: string;
  color?: string;
}

export interface RangeDataItemOptions {
  x?: number;
  low: number;
  high: number;
  id?: string;
  name?: string;
  color?: string;
}

export interface TreeMapDataItemOptions {
  value: number;
  id?: string;
  name: string;
  color?: string;
}

export interface AbstractSeriesOptions {
  id?: string;
  name: string;
  color?: string;
}

// The simpler version of Highcharts.PointMarkerOptionsObject
export interface PointMarkerOptions {
  enabled?: boolean;
  enabledThreshold?: number;
  height?: number;
  width?: number;
  symbol?: "circle" | "diamond" | "square" | "triangle" | "triangle-down";
}
