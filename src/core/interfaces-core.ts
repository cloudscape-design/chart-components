// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { ReadonlyAsyncStore } from "../internal/utils/async-store";
import {
  BaseChartProps,
  BaseI18nStrings,
  ChartFilterOptions,
  ChartFooterOptions,
  ChartHeaderOptions,
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
  legend?: ChartLegendOptions;
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
   * The list of series or points IDs that should be hidden (using Highcharts `item.setVisible(false)`).
   * When the item ID is not set, the name is used instead.
   */
  hiddenItems?: readonly string[];
  /**
   * A callback triggered when clicking on a legend item.
   */
  onItemVisibilityChange?: (hiddenItems: readonly string[]) => void;
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
export interface CoreChartAPI extends CoreChartLegendAPI, CoreChartTooltipAPI {
  chart: Highcharts.Chart;
  highcharts: typeof Highcharts;
}

export interface CoreChartTooltipAPI {
  showTooltipOnPoint(point: Highcharts.Point): void;
  hideTooltip(): void;
}

export interface InternalCoreChartTooltipAPI extends CoreChartTooltipAPI {
  store: ReadonlyAsyncStore<{ visible: boolean; pinned: boolean; point: null | Highcharts.Point }>;
  onMouseEnterTooltip(): void;
  onMouseLeaveTooltip(): void;
  onDismissTooltip(): void;
  getTrack(): null | SVGElement;
}

export interface ChartLegendRef {
  highlightItems: (ids: readonly string[]) => void;
  clearHighlight: () => void;
}

export interface CoreChartLegendAPI {
  onItemVisibilityChange(hiddenItems: string[]): void;
  onItemHighlightEnter(itemId: string): void;
  onItemHighlightExit(): void;
}

export interface InternalCoreChartLegendAPI extends CoreChartLegendAPI {
  ref(ref: null | ChartLegendRef): void;
  store: ReadonlyAsyncStore<{ items: readonly ChartLegendItem[] }>;
  legend: ChartLegendRef;
}

export interface InternalCoreChartNoDataAPI {
  store: ReadonlyAsyncStore<{ container: null | Element; noMatch: boolean }>;
}

export interface InternalCoreAxesAPI {
  store: ReadonlyAsyncStore<{ visible: boolean; titles: string[] }>;
}

export interface CoreTooltipOptions extends ChartTooltipOptions {
  getTargetFromPoint?(point: Highcharts.Point): Rect;
  getTooltipContent?(props: { point: Highcharts.Point }): null | TooltipContent;
  onPointHighlight?(props: { point: Highcharts.Point; target: Rect }): null | PointHighlightDetail;
  onClearHighlight?(chart: Highcharts.Chart): void;
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

export type CoreI18nStrings = BaseI18nStrings;
