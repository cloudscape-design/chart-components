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
  legend?: BaseLegendOptions;

  /**
   * The empty, no-match, loading, or error state of the chart.
   */
  noData?: BaseNoDataOptions;

  /**
   * Use filter to render default series filter, custom series filter, and/or additional filters.
   */
  filter?: BaseFilterOptions;

  /**
   * An object that contains all of the localized strings required by the component.
   * @i18n
   */
  i18nStrings?: CoreI18nStrings;
}

export interface BaseLegendOptions {
  enabled?: boolean;
  title?: string;
  actions?: React.ReactNode;
}

export interface BaseNoDataOptions {
  statusType?: "finished" | "loading" | "error";
  empty?: React.ReactNode;
  error?: React.ReactNode;
  loading?: React.ReactNode;
  noMatch?: React.ReactNode;
  onRecoveryClick?: NonCancelableEventHandler;
}

export interface BaseI18nStrings {
  /** Text that is displayed when the chart is loading, i.e. when `noData.statusType` is set to `"loading". */
  loadingText?: string;
  /** Text that is displayed when the chart is in error state, i.e. when `noData.statusType` is set to `"error". */
  errorText?: string;
  /** Text for the recovery button that is displayed next to the error text. */
  recoveryText?: string;
  /** Visible label of the default series filter */
  seriesFilterLabel?: string;
  /** Placeholder text of the default series filter */
  seriesFilterPlaceholder?: string;
  /** ARIA label of the default series filter which is appended to any option that is selected */
  seriesFilterSelectedAriaLabel?: string;
  /** ARIA label that is associated with the legend in case there is no visible `legendTitle` defined */
  legendAriaLabel?: string;
  /** ARIA label for details popover dismiss button */
  detailPopoverDismissAriaLabel?: string;
  /** Generalized accessible description of the chart, e.g. "line chart" */
  chartAccessibleDescription?: string;
}

export interface CartesianI18nStrings extends BaseI18nStrings {
  /** Generalized accessible description of the x axis, e.g. "x axis" */
  xAxisAccessibleDescription?: string;
  /** Generalized accessible description of the y axis, e.g. "y axis" */
  yAxisAccessibleDescription?: string;
}

export interface PieI18nStrings extends BaseI18nStrings {
  /** Generalized accessible description of the pie chart segment */
  segmentAccessibleDescription?: string;
}

export type CoreI18nStrings = CartesianI18nStrings & PieI18nStrings;

export interface BaseFilterOptions {
  seriesFilter?: boolean;
  additionalFilters?: React.ReactNode;
}

export interface AreaSeriesOptions extends BaseCartesianSeriesOptions {
  type: "area";
  data: readonly PointDataItemType[];
}

export interface AreaSplineSeriesOptions extends BaseCartesianSeriesOptions {
  type: "areaspline";
  data: readonly PointDataItemType[];
}

export interface ColumnSeriesOptions extends BaseCartesianSeriesOptions {
  type: "column";
  data: readonly PointDataItemType[];
}

export interface LineSeriesOptions extends BaseCartesianSeriesOptions {
  type: "line";
  data: readonly PointDataItemType[];
}

export interface SplineSeriesOptions extends BaseCartesianSeriesOptions {
  type: "spline";
  data: readonly PointDataItemType[];
}

export interface ScatterSeriesOptions extends BaseCartesianSeriesOptions {
  type: "scatter";
  data: readonly PointDataItemType[];
  marker?: PointMarkerOptions;
}

export interface ErrorBarSeriesOptions extends Omit<BaseCartesianSeriesOptions, "name"> {
  type: "errorbar";
  name?: string;
  data: readonly RangeDataItemOptions[];
  linkedTo: string;
}

export interface XThresholdSeriesOptions extends BaseCartesianSeriesOptions {
  type: "x-threshold";
  value: number;
}

export interface YThresholdSeriesOptions extends BaseCartesianSeriesOptions {
  type: "y-threshold";
  value: number;
}

export interface PieSeriesOptions extends BaseCartesianSeriesOptions {
  type: "pie";
  data: readonly PieSegmentOptions[];
}

export interface DonutSeriesOptions extends BaseCartesianSeriesOptions {
  type: "donut";
  data: readonly PieSegmentOptions[];
}

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

interface BaseCartesianSeriesOptions {
  id?: string;
  name: string;
  color?: string;
}

// The symbols union matches that of Highcharts.PointMarkerOptionsObject
interface PointMarkerOptions {
  symbol?: "circle" | "diamond" | "square" | "triangle" | "triangle-down";
}

export interface CoreChartProps
  extends Pick<
      BaseChartOptions,
      | "highcharts"
      | "fallback"
      | "fitHeight"
      | "chartHeight"
      | "chartMinHeight"
      | "chartMinWidth"
      | "ariaLabel"
      | "ariaDescription"
      | "filter"
      | "noData"
      | "i18nStrings"
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
  tooltip?: CoreTooltipOptions;
  /**
   * A custom slot above the chart plot, chart's axis title, and filter.
   */
  header?: CoreHeaderOptions;
  /**
   * Prop for passing a custom navigation control component to be rendered with the chart.
   * Use this property to add timeline navigation, range selectors, or other custom navigation elements.
   */
  navigator?: React.ReactNode;
  /**
   * A custom slot below the chart plot and legend.
   */
  footer?: CoreFooterOptions;
  /**
   * Chart legend options.
   */
  legend?: CoreLegendOptions;
  /**
   * The callback to init the chart's API when it is ready. The API includes the Highcharts chart object, and
   * additional Cloudscape methods.
   */
  callback?: (chart: CoreChartAPI) => void;
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
  onVisibleItemsChange?: (legendItems: readonly CoreLegendItem[]) => void;
  /**
   * Called whenever chart tooltip is rendered to provide content for tooltip's header, body, and (optional) footer.
   */
  getTooltipContent?: GetTooltipContent;
  /**
   * Called whenever a legend item is hovered to provide content for legend tooltip's header, body, and (optional) footer.
   * If not provided, no tooltip will be displayed.
   */
  getLegendTooltipContent?: GetLegendTooltipContent;
  /**
   * Called whenever chart point or group is highlighted.
   */
  onHighlight?(props: ChartHighlightProps): void;
  /**
   * Called whenever chart point or group loses highlight.
   */
  onClearHighlight?(): void;
  /**
   * Use Cloudscape keyboard navigation, `true` by default.
   */
  keyboardNavigation?: boolean;
}

export interface CoreLegendOptions extends BaseLegendOptions {
  bottomMaxHeight?: number;
  position?: "bottom" | "side";
}

export interface CoreLegendItem {
  id: string;
  name: string;
  marker: React.ReactNode;
  visible: boolean;
  highlighted: boolean;
}

export interface CoreLegendItemSpec {
  id: string;
  name: string;
  markerType: ChartSeriesMarkerType;
  color: string;
  visible: boolean;
}

export interface CoreTooltipOptions {
  enabled?: boolean;
  placement?: "middle" | "outside" | "target";
  size?: "small" | "medium" | "large";
}

export interface CoreHeaderOptions {
  content: React.ReactNode;
}

export interface CoreFooterOptions {
  content: React.ReactNode;
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

export type GetLegendTooltipContent = (props: GetLegendTooltipContentProps) => TooltipContent;

export interface GetLegendTooltipContentProps {
  legendItem: CoreLegendItem;
}

export interface CoreTooltipContent {
  point?: (props: TooltipPointProps) => TooltipPointFormatted;
  header?: (props: TooltipSlotProps) => React.ReactNode;
  body?: (props: TooltipSlotProps) => React.ReactNode;
  footer?: (props: TooltipSlotProps) => React.ReactNode;
}

export interface TooltipContentItem {
  point: Highcharts.Point;
  errorRanges: Highcharts.Point[];
}

export interface TooltipPointProps {
  item: TooltipContentItem;
}

export interface TooltipSlotProps {
  x: number;
  items: TooltipContentItem[];
}

export interface TooltipPointFormatted {
  key?: React.ReactNode;
  value?: React.ReactNode;
  description?: React.ReactNode;
  expandable?: boolean;
  subItems?: ReadonlyArray<{ key: React.ReactNode; value: React.ReactNode }>;
}

// The extended version of Highcharts.Options. The axes types are extended with Cloudscape value formatter.
// We use a custom formatter because we cannot use the built-in Highcharts formatter for our tooltip.
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
