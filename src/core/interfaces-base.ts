// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NonCancelableEventHandler } from "../internal/events";

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
   * The height of the chart plot in pixels. It does not include legend, header, and footer.
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
   */
  colors?: string[];

  /**
   * Chart tooltip props.
   */
  tooltip?: ChartTooltipOptions;

  /**
   * Chart legend props.
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
  placement?: "target" | "bottom" | "middle";
  size?: "small" | "medium" | "large";
}

export interface ChartLegendOptions {
  enabled?: boolean;
  title?: string;
  actions?: {
    render?(props: LegendActionsRenderProps): React.ReactNode;
  };
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
  render?(props: BaseHeaderRenderProps): React.ReactNode;
}

export interface BaseHeaderRenderProps {
  legendItems: ChartLegendItem[];
}

export interface ChartFooterOptions {
  render?(props: BaseFooterRenderProps): React.ReactNode;
}

export interface BaseFooterRenderProps {
  legendItems: ChartLegendItem[];
}

export interface LegendActionsRenderProps {
  legendItems: readonly ChartLegendItem[];
}

export interface ChartLegendItem {
  id: string;
  name: string;
  marker: React.ReactNode;
  visible: boolean;
}

export interface BaseI18nStrings {
  loadingText?: string;
  errorText?: string;
  recoveryText?: string;
}

export interface ChartFilterOptions {
  seriesFilter?: boolean;
  additionalFilters?: React.ReactNode;
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
  type: "donut";
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
  type: "x-threshold";
  value: number;
}

export interface YThresholdSeries extends AbstractSeries {
  type: "y-threshold";
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
