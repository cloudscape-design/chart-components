// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { ChartSeriesMarkerType } from "../internal/components/series-marker";
import { NonCancelableEventHandler } from "../internal/events";

// All charts take `highcharts` instance, that can be served statically or dynamically.
// Although it has to be of type Highcharts, the TS type we use is `null | object`, so
// that it is ignored by the documenter.

/**
 * This interface includes common public chart properties, applicable for all chart types.
 */
export interface BaseChartOptions {
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
  highlighted: boolean;
}

export interface ChartI18nStrings {
  loadingText?: string;
  errorText?: string;
  recoveryText?: string;
  seriesFilterLabel?: string;
  seriesFilterPlaceholder?: string;
  legendAriaLabel?: string;
  detailPopoverDismissAriaLabel?: string;
}

export interface ChartFilterOptions {
  seriesFilter?: boolean;
  additionalFilters?: React.ReactNode;
}

export interface AreaSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "area";
  data: readonly PointDataItemType[];
}

export interface AreaSplineSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "areaspline";
  data: readonly PointDataItemType[];
}

export interface ColumnSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "column";
  data: readonly PointDataItemType[];
}

export interface LineSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "line";
  data: readonly PointDataItemType[];
}

export interface SplineSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "spline";
  data: readonly PointDataItemType[];
}

export interface ScatterSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "scatter";
  data: readonly PointDataItemType[];
  marker?: PointMarkerOptions;
}

export interface ErrorBarSeriesOptions extends BaseCartesianSeriesOptions {
  type: "errorbar";
  data: readonly RangeDataItemOptions[];
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
  data: readonly PieSegmentOptions[];
}

export interface DonutSeriesOptions extends BaseCartesianSeriesOptionsWithName {
  type: "donut";
  data: readonly PieSegmentOptions[];
}

// The data items are simpler versions of Highcharts.PointOptionsObject

export interface PieSegmentOptions {
  y: number | null;
  id?: string;
  name: string;
  color?: string;
}

export type PointDataItemType = null | number | PointDataItemOptions;

export interface PointDataItemOptions {
  x?: number;
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

export interface CoreChartProps
  extends Pick<
      BaseChartOptions,
      "highcharts" | "fitHeight" | "chartHeight" | "chartMinHeight" | "chartMinWidth" | "ariaLabel" | "ariaDescription"
    >,
    CoreCartesianOptions {
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
   * IDs of visible series or points.
   */
  visibleItems?: readonly string[];
  /**
   * Called when series/points visibility changes due to user interaction with legend or filter.
   */
  onVisibleItemsChange?: (legendItems: readonly ChartLegendItem[]) => void;
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

export interface CoreCartesianOptions {
  /**
   * When set to `true`, adds a visual emphasis on the zero baseline axis.
   */
  emphasizeBaseline?: boolean;
  /**
   * When set to "top", the title of the vertical axis (can be x or y)
   * is shown right above the chart plot.
   */
  verticalAxisTitlePlacement?: "top" | "side";
}

export type GetTooltipContent = (props: GetTooltipContentProps) => CoreTooltipContent;

export interface GetTooltipContentProps {
  point: null | Highcharts.Point;
  group: readonly Highcharts.Point[];
}

export interface CoreTooltipContent {
  point?: (props: TooltipPointProps) => TooltipPointFormatted;
  header?: (props: TooltipSlotProps) => React.ReactNode;
  body?: (props: TooltipSlotProps) => React.ReactNode;
  footer?: (props: TooltipSlotProps) => React.ReactNode;
}

export interface TooltipItem {
  point: Highcharts.Point;
  linkedErrorbars: Highcharts.Point[];
}

export interface TooltipPointProps {
  item: TooltipItem;
}

export interface TooltipSlotProps {
  x: number;
  items: TooltipItem[];
}

export interface TooltipPointFormatted {
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
  group: readonly Highcharts.Point[];
}

// The API methods allow programmatic triggering of chart's behaviors, some of which are not accessible via React state.
// This enables advanced integration scenarios, such as building a custom legend, or making multiple charts synchronized.
export interface CoreChartAPI {
  chart: Highcharts.Chart;
  highcharts: typeof Highcharts;
  setItemsVisible(itemIds: readonly string[]): void;
  highlightChartPoint(point: Highcharts.Point): void;
  highlightChartGroup(group: readonly Highcharts.Point[]): void;
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
