// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { ChartSeriesMarkerType } from "../internal/components/series-marker/types";
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

export interface CoreChartProps
  extends Pick<
    BaseChartProps,
    "highcharts" | "fitHeight" | "chartHeight" | "chartMinHeight" | "chartMinWidth" | "ariaLabel" | "ariaDescription"
  > {
  /**
   * The Highcharts options. Cloudscape injects custom styles and settings, but all can be
   * overridden with explicitly provided options. An exception is event handlers - those are
   * not overridden, but merged with Cloudscape event handlers so that both are getting called.
   */
  options: InternalChartOptions;
  /**
   * The Cloudscape tooltip, that comes with a vertical cursor when used on cartesian series.
   * The tooltip content is only shown when `getContent` property is defined, which is called
   * for each visited { x, y } point.
   */
  tooltip?: ChartTooltipOptions;
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
  /**
   * IDs of visible series or points.
   */
  visibleItems?: readonly string[];
  /**
   * Called when series/points visibility changes due to user interaction with legend or filter.
   */
  onLegendItemsChange?: (legendItems: readonly ChartLegendItem[]) => void;
  /**
   * Called whenever chart tooltip is rendered to provide content for tooltip's header, body, and (optional) footer.
   */
  getTooltipContent?: GetTooltipContent;
  /**
   * Called whenever chart point or group is highlighted.
   */
  onHighlight?(props: ChartHighlightProps): void;
  /**
   * Called whenever chart point or group loses highlight.
   */
  onClearHighlight?(): void;
  /**
   * Use Cloudscape keyboard navigation.
   */
  keyboardNavigation?: boolean;
}

export type GetTooltipContent = (props: GetTooltipContentProps) => CoreTooltipContent;

export interface GetTooltipContentProps {
  point: null | Highcharts.Point;
  group: Highcharts.Point[];
}

export interface CoreTooltipContent {
  series?: (props: TooltipSeriesProps) => TooltipSeriesFormatted;
  header?: (props: TooltipSlotProps) => React.ReactNode;
  body?: (props: TooltipSlotProps) => React.ReactNode;
  footer?: (props: TooltipSlotProps) => React.ReactNode;
}

export interface TooltipItem {
  point: Highcharts.Point;
  linkedErrorbars: Highcharts.Point[];
}

export interface TooltipSeriesProps {
  item: TooltipItem;
}

export interface TooltipSlotProps {
  x: number;
  items: TooltipItem[];
}

export interface TooltipSeriesFormatted {
  key: React.ReactNode;
  value: React.ReactNode;
  details?: React.ReactNode;
  expandable?: boolean;
  subItems?: ReadonlyArray<{ key: React.ReactNode; value: React.ReactNode }>;
}

// The extended version of Highcharts.Options;
export type InternalChartOptions = Omit<Highcharts.Options, "xAxis" | "yAxis"> & {
  xAxis?: InternalXAxisOptions | InternalXAxisOptions[];
  yAxis?: InternalYAxisOptions | InternalYAxisOptions[];
};

export type InternalXAxisOptions = Highcharts.XAxisOptions & { valueFormatter?: (value: null | number) => string };
export type InternalYAxisOptions = Highcharts.YAxisOptions & { valueFormatter?: (value: null | number) => string };
export interface ChartHighlightProps {
  point: null | Highcharts.Point;
  group: Highcharts.Point[];
}

// The API methods allow programmatic triggering of chart's behaviors, some of which are not accessible via React state.
// This enables advanced integration scenarios, such as building a custom legend, or making multiple charts synchronized.
export interface CoreChartAPI {
  chart: Highcharts.Chart;
  highcharts: typeof Highcharts;
  highlightChartPoint(point: Highcharts.Point): void;
  highlightChartGroup(group: Highcharts.Point[]): void;
  clearChartHighlight(): void;
}

export interface InternalChartLegendItemSpec {
  id: string;
  name: string;
  color: string;
  markerType: ChartSeriesMarkerType;
  visible: boolean;
}

export interface Rect {
  x: number;
  y: number;
  height: number;
  width: number;
}

export interface TooltipContent {
  header: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
}

export type CoreNoDataProps = ChartNoDataOptions;

export type CoreI18nStrings = ChartI18nStrings;
