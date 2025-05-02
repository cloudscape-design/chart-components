// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { ChartSeriesMarkerType } from "../internal/components/series-marker";
import {
  BaseChartProps,
  ChartFilterOptions,
  ChartFooterOptions,
  ChartHeaderOptions,
  ChartI18nStrings,
  ChartLegendItem,
  ChartLegendOptions,
  ChartNoDataOptions,
  ChartTooltipOptions,
} from "./interfaces-base";

export interface CoreChartProps extends Pick<BaseChartProps, "fitHeight" | "chartMinHeight" | "chartMinWidth"> {
  /**
   * The Highcharts instance. When null, the fallback() is rendered instead.
   */
  highcharts: null | object;
  /**
   * The Highcharts options. Cloudscape injects custom styles and settings, but all can be
   * overridden with explicitly provided options. An exception is event handlers - those are
   * not overridden, but merged with Cloudscape event handlers so that both are getting called.
   */
  options: Highcharts.Options;
  /**
   * The Cloudscape tooltip, that comes with a vertical cursor when used on cartesian series.
   * The tooltip content is only shown when `getContent` property is defined, which is called
   * for each visited { x, y } point.
   */
  tooltip?: CoreTooltipOptions;
  /**
   * The Cloudscape legend, that is rendered outside the Highcharts container. It uses Cloudscape markers
   * and menu actions.
   */
  legend?: CoreLegendOptions;
  /**
   * Represents chart's empty, no-match, loading, and error states. It requires the Highcharts nodata module.
   */
  noData?: CoreNoDataProps;
  /**
   * A custom slot above the chart plot, chart's axis title, and filter.
   */
  header?: ChartHeaderOptions;
  /**
   * A custom slot below the chart plot and legend.
   */
  footer?: ChartFooterOptions;
  /**
   * Chart series/custom filter options.
   */
  filter?: ChartFilterOptions;
  /**
   * Custom content to be rendered when `highcharts=null`. It defaults to a spinner.
   */
  fallback?: React.ReactNode;
  /**
   * The callback to init the chart's API when it is ready. The API includes the Highcharts chart object, and
   * additional Cloudscape methods:
   * - `showTooltipOnPoint(Highcharts.Point)` - shows Cloudscape tooltip for the given point, if tooltip content is defined.
   * - `hideTooltip()` - hides Cloudscape tooltip until the next user event or `showTooltipOnPoint(point)` call.
   * - `highlightLegendItems(string[])` - makes specified legend items highlighted (when Cloudscape legend is used).
   * - `clearLegendHighlight()` - clears legend highlight.
   */
  callback?: (chart: CoreChartAPI) => void;
  /**
   * An object that contains all of the localized strings required by the component.
   * @i18n
   */
  i18nStrings?: CoreI18nStrings;
  /**
   * This is used to provide a test-utils selector. Do not use this property to provide custom styles.
   */
  className?: string;
  /**
   * This property is only relevant for cartesian charts. When set to "top", the title of the vertical axis (can be x or y)
   * is shown right above the chart plot.
   */
  verticalAxisTitlePlacement?: "top" | "side";
}

// The API methods allow programmatic triggering of chart's behaviors, some of which are not accessible via React state.
// This enables advanced integration scenarios, such as building a custom legend, or making multiple charts synchronized.
export interface CoreChartAPI {
  chart: Highcharts.Chart;
  highcharts: typeof Highcharts;
  showTooltipOnPoint(point: Highcharts.Point): void;
  hideTooltip(): void;
  registerLegend(legend: RegisteredLegendAPI): void;
  unregisterLegend(): void;
}

export interface RegisteredLegendAPI {
  highlightItems: (ids: readonly string[]) => void;
  clearHighlight: () => void;
}

export interface CoreTooltipOptions extends ChartTooltipOptions {
  getTargetFromPoint?(point: Highcharts.Point): Rect;
  getTooltipContent?(props: { point: Highcharts.Point }): null | TooltipContent;
  onPointHighlight?(props: { point: Highcharts.Point; target: Rect }): null | PointHighlightDetail;
  onClearHighlight?(): void;
}

export interface CoreLegendOptions extends ChartLegendOptions {
  visibleItems?: readonly string[];
  getChartLegendItems?(props: { chart: Highcharts.Chart }): readonly ChartLegendItemSpec[];
  onItemVisibilityChange?: (visibleItems: readonly string[]) => void;
}

export interface ChartLegendItemSpec {
  id: string;
  name?: string;
  marker?: React.ReactNode;
}

export interface InternalChartLegendItemSpec {
  id: string;
  name: string;
  color: string;
  markerType: ChartSeriesMarkerType;
  visible: boolean;
  marker?: React.ReactNode;
}

export interface Rect {
  x: number;
  y: number;
  height: number;
  width: number;
}

export interface PointHighlightDetail {
  matchedLegendItems: string[];
}

export interface TooltipContent {
  header: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
}

export type CoreNoDataProps = ChartNoDataOptions;

export type CoreI18nStrings = ChartI18nStrings;

export interface ReactiveChartState {
  tooltip: {
    visible: boolean;
    pinned: boolean;
    point: null | Highcharts.Point;
  };
  legend: {
    items: readonly ChartLegendItem[];
  };
  noData: {
    container: null | Element;
    noMatch: boolean;
  };
  axes: {
    verticalAxesTitles: readonly string[];
  };
}
