// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import type * as InternalComponentTypes from "../internal/components/interfaces";
import { type NonCancelableEventHandler } from "../internal/events";

// All charts take `highcharts` instance, that can be served statically or dynamically.
// Although it has to be of type Highcharts, the TS type we use is `null | object`, so
// that it is ignored by the documenter.

/**
 * This interface includes common public chart properties, applicable for all chart types.
 */
export interface BaseChartOptions {
  /**
   * The Highcharts instance, which can be obtained using `import Highcharts from "highcharts"`.
   * Supported Highcharts versions: 12.
   */
  highcharts: null | object;

  /**
   * Custom content that renders when `highcharts=null`. It renders a spinner if not defined.
   */
  fallback?: React.ReactNode;

  /**
   * The height of the chart plot in pixels. It does not include legend and filter.
   */
  chartHeight?: number;

  /**
   * The chart automatically adjusts its height to fill the parent container when this property is set.
   */
  fitHeight?: boolean;

  /**
   * Defines the minimum allowed height of the chart plot. Use this when `fitHeight=true` to
   * prevent the chart plot from becoming too small to display its content. When the parent
   * container is smaller than the minimum height, a vertical scrollbar appears automatically.
   */
  chartMinHeight?: number;

  /**
   * Defines the minimum allowed width of the chart plot. When the parent container is smaller the
   * minimum width, the horizontal scrollbar is automatically added.
   */
  chartMinWidth?: number;

  /**
   * Defines the ARIA label for the chart container.
   * This property corresponds to [lang.chartContainerLabel](https://api.highcharts.com/highcharts/lang.accessibility.chartContainerLabel),
   * and requires the [accessibility module](https://www.highcharts.com/docs/accessibility/accessibility-module).
   */
  ariaLabel?: string;

  /**
   * Defines the ARIA description of the chart container.
   * This property corresponds to [accessibility.description](https://api.highcharts.com/highcharts/accessibility.description),
   * and requires the [accessibility module](https://www.highcharts.com/docs/accessibility/accessibility-module).
   */
  ariaDescription?: string;

  /**
   * Defines chart legend options, including:
   * * `enabled` (optional, boolean) - Hides legend when set to `false`.
   * * `title` (optional, string) - Visible label, shown above the legend.
   * * `actions` (optional, slot) - A slot before the legend that can be used to render custom actions.
   */
  legend?: BaseLegendOptions;

  /**
   * Defines options to represent empty, no-match, loading, and error state of the chart, including:
   * * `statusType` (optional, "finished" | "loading" | "error") - Specifies the current status of loading data.
   * * `empty` (optional, ReactNode) - Content displayed when the chart data is empty.
   * * `noMatch` (optional, ReactNode) - Content displayed when there is no data to display due to the built-in filtering.
   * * `loading` (optional, ReactNode) - Content displayed when `statusType="loading"`. If omitted, the default loading state
   * is shown, using `i18n.loadingText` or built-in i18n.
   * * `error` (optional, ReactNode) - Content displayed when `statusType="error"`. If omitted, the default error state
   * is shown, using `i18n.errorText` and `i18n.recoveryText` (when `onRecoveryClick` is provided), or built-in i18n.
   * * `onRecoveryClick` (optional, function) - Called when the user clicks the recovery button that appears when using default error
   * state, and only if `onRecoveryClick` is provided. Use this to enable the user to retry a failed request or provide another option
   * for the user to recover from the error.
   */
  noData?: BaseNoDataOptions;

  /**
   * Defines options for filtering in the chart, including:
   * * `seriesFilter` (optional, boolean) - Displays default series filter at the top of the chart.
   * * `additionalFilters` (optional, slot) - A slot for custom chart filters at the top of the chart.
   */
  filter?: BaseFilterOptions;
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

export interface BaseTooltipDetail {
  key: React.ReactNode;
  value: React.ReactNode;
}

export interface BaseI18nStrings {
  loadingText?: string;
  errorText?: string;
  recoveryText?: string;
  seriesFilterLabel?: string;
  seriesFilterPlaceholder?: string;
  seriesFilterSelectedAriaLabel?: string;
  legendAriaLabel?: string;
  detailPopoverDismissAriaLabel?: string;
  chartRoleDescription?: string;
}

export interface WithCartesianI18nStrings {
  /**
   * An object that contains all of the localized strings required by the component.
   * @i18n
   *
   * Available properties:
   * * `loadingText` (optional, string) - Text, displayed when the chart is loading, i.e. when `noData.statusType` is set to "loading".
   * * `errorText` (optional, string) - Text, displayed when the chart is in error state, i.e. when `noData.statusType` is set to "error".
   * * `recoveryText` (optional, string) - Text for the recovery button, displayed next to the error text.
   * * `seriesFilterLabel` (optional, string) - Text for the visible label of the default series filter.
   * * `seriesFilterPlaceholder` (optional, string) - Text for the default series filter placeholder.
   * * `seriesFilterSelectedAriaLabel` (optional, string) - ARIA label of the default series filter which is appended to any option that is selected.
   * * `legendAriaLabel` (optional, string) - ARIA label that is associated with the legend in case there is no visible `legend.title` defined.
   * * `detailPopoverDismissAriaLabel` (optional, string) - ARIA label for the details popover dismiss button.
   * * `chartRoleDescription` (optional, string) - Accessible role description of the chart plot area, e.g. "interactive chart".
   * * `xAxisRoleDescription` (optional, string) - Accessible role description of the x axis, e.g. "x axis".
   * * `yAxisRoleDescription` (optional, string) - Accessible role description of the y axis, e.g. "y axis".
   */
  i18nStrings?: CartesianI18nStrings;
}

export interface WithPieI18nStrings {
  /**
   * An object that contains all of the localized strings required by the component.
   * @i18n
   *
   * Available properties:
   * * `loadingText` (optional, string) - Text, displayed when the chart is loading, i.e. when `noData.statusType` is set to "loading".
   * * `errorText` (optional, string) - Text, displayed when the chart is in error state, i.e. when `noData.statusType` is set to "error".
   * * `recoveryText` (optional, string) - Text for the recovery button, displayed next to the error text.
   * * `seriesFilterLabel` (optional, string) - Text for the visible label of the default series filter.
   * * `seriesFilterPlaceholder` (optional, string) - Text for the default series filter placeholder.
   * * `seriesFilterSelectedAriaLabel` (optional, string) - ARIA label of the default series filter which is appended to any option that is selected.
   * * `legendAriaLabel` (optional, string) - ARIA label that is associated with the legend in case there is no visible `legend.title` defined.
   * * `detailPopoverDismissAriaLabel` (optional, string) - ARIA label for the details popover dismiss button.
   * * `chartRoleDescription` (optional, string) - Accessible role description of the chart plot area, e.g. "interactive chart".
   * * `segmentRoleDescription` (optional, string) - Accessible role description of the segment.
   */
  i18nStrings?: PieI18nStrings;
}

export interface CartesianI18nStrings extends BaseI18nStrings {
  xAxisRoleDescription?: string;
  yAxisRoleDescription?: string;
}

export interface PieI18nStrings extends BaseI18nStrings {
  segmentRoleDescription?: string;
}

export interface BaseFilterOptions {
  seriesFilter?: boolean;
  additionalFilters?: React.ReactNode;
}

export interface BaseTooltipPointFormatted {
  key?: React.ReactNode;
  value?: React.ReactNode;
  description?: React.ReactNode;
  expandable?: boolean;
  subItems?: ReadonlyArray<{ key: React.ReactNode; value: React.ReactNode }>;
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

export interface CoreCartesianOptions {
  /**
   * When set to `true`, adds a visual emphasis on the zero baseline axis.
   */
  emphasizeBaseline?: boolean;
  /**
   * Controls the placement of the vertical axis title.
   * When set to "side", displays the title along the axis line.
   */
  verticalAxisTitlePlacement?: "top" | "side";
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
    >,
    CoreCartesianOptions {
  /**
   * The Highcharts options. Cloudscape injects custom styles and settings, but all can be
   * overridden with explicitly provided options. An exception is event handlers - those are
   * not overridden, but merged with Cloudscape event handlers so that both are getting called.
   */
  options: CoreChartProps.ChartOptions;
  /**
   * The Cloudscape tooltip, that comes with a vertical cursor when used on cartesian series.
   * The tooltip content is only shown when `getContent` property is defined, which is called
   * for each visited { x, y } point.
   */
  tooltip?: CoreChartProps.TooltipOptions;
  /**
   * A custom slot above the chart plot, chart's axis title, and filter.
   */
  header?: CoreChartProps.HeaderOptions;
  /**
   * Prop for passing a custom navigation control component to be rendered with the chart.
   * Use this property to add timeline navigation, range selectors, or other custom navigation elements.
   */
  navigator?: React.ReactNode;
  /**
   * A custom slot below the chart plot and legend.
   */
  footer?: CoreChartProps.FooterOptions;
  /**
   * Chart legend options.
   */
  legend?: CoreChartProps.LegendOptions;
  /**
   * The callback to init the chart's API when it is ready. The API includes the Highcharts chart object, and
   * additional Cloudscape methods.
   */
  callback?: (chart: CoreChartProps.ChartAPI) => void;
  /**
   * This is used to provide a test-utils selector. Do not use this property to provide custom styles.
   */
  className?: string;
  /**
   * IDs of visible series or points.
   */
  visibleItems?: readonly string[];
  /**
   * Called when a legend item is highlighted.
   */
  onLegendItemHighlight?: NonCancelableEventHandler<CoreChartProps.LegendItemHighlightDetail>;
  /**
   * Called when series/points visibility changes due to user interaction with legend or filter.
   */
  onVisibleItemsChange?: NonCancelableEventHandler<CoreChartProps.VisibleItemsChangeDetail>;
  /**
   * Called whenever chart tooltip is rendered to provide content for tooltip's header, body, and (optional) footer.
   */
  getTooltipContent?: CoreChartProps.GetTooltipContent;
  /**
   * Called whenever a legend item is hovered to provide content for legend tooltip's header, body, and (optional) footer.
   * If not provided, no tooltip will be displayed.
   */
  getLegendTooltipContent?: CoreChartProps.GetLegendTooltipContent;
  /**
   * Called whenever chart point or group is highlighted.
   */
  onHighlight?: NonCancelableEventHandler<CoreChartProps.HighlightChangeDetail>;
  /**
   * Called whenever chart point or group loses highlight.
   */
  onClearHighlight?: NonCancelableEventHandler<CoreChartProps.HighlightClearDetail>;
  /**
   * Use Cloudscape keyboard navigation, `true` by default.
   */
  keyboardNavigation?: boolean;
  /**
   * An object that contains all of the localized strings required by the component.
   * @i18n
   */
  i18nStrings?: CartesianI18nStrings & PieI18nStrings;
}

export namespace CoreChartProps {
  // The API methods allow programmatic triggering of chart's behaviors, some of which are not accessible via React state.
  // This enables advanced integration scenarios, such as building a custom legend, or making multiple charts synchronized.
  export interface ChartAPI {
    chart: Highcharts.Chart;
    highcharts: typeof Highcharts;
    highlightItems(itemIds: readonly string[]): void;
    setItemsVisible(itemIds: readonly string[]): void;
    highlightChartPoint(point: Highcharts.Point): void;
    highlightChartGroup(group: readonly Highcharts.Point[]): void;
    clearChartHighlight(): void;
  }

  // The extended version of Highcharts.Options. The axes types are extended with Cloudscape value formatter.
  // We use a custom formatter because we cannot use the built-in Highcharts formatter for our tooltip.
  export type ChartOptions = Omit<Highcharts.Options, "xAxis" | "yAxis"> & {
    xAxis?: XAxisOptions | XAxisOptions[];
    yAxis?: YAxisOptions | YAxisOptions[];
  };
  export type XAxisOptions = Highcharts.XAxisOptions & { valueFormatter?: (value: null | number) => string };
  export type YAxisOptions = Highcharts.YAxisOptions & { valueFormatter?: (value: null | number) => string };

  export interface HeaderOptions {
    content: React.ReactNode;
  }
  export interface FooterOptions {
    content: React.ReactNode;
  }

  export interface LegendOptions extends BaseLegendOptions {
    bottomMaxHeight?: number;
    position?: "bottom" | "side";
  }
  export type LegendItem = InternalComponentTypes.LegendItem;
  export type LegendTooltipContent = InternalComponentTypes.LegendTooltipContent;
  export type GetLegendTooltipContent = InternalComponentTypes.GetLegendTooltipContent;
  export type GetLegendTooltipContentProps = InternalComponentTypes.GetLegendTooltipContentProps;

  export interface TooltipOptions {
    enabled?: boolean;
    placement?: "middle" | "outside" | "target";
    size?: "small" | "medium" | "large";
  }

  export type GetTooltipContent = (props: GetTooltipContentProps) => TooltipContentRenderer;
  export interface GetTooltipContentProps {
    point: null | Highcharts.Point;
    group: readonly Highcharts.Point[];
  }
  export interface TooltipContentRenderer {
    point?: (props: TooltipPointProps) => TooltipPointFormatted;
    details?: (props: TooltipDetailsProps) => readonly TooltipDetail[];
    header?: (props: TooltipSlotProps) => React.ReactNode;
    body?: (props: TooltipSlotProps) => React.ReactNode;
    footer?: (props: TooltipSlotProps) => React.ReactNode;
  }
  export type TooltipPointFormatted = BaseTooltipPointFormatted;
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

  export interface TooltipDetailsProps {
    point: Highcharts.Point;
  }

  export type TooltipDetail = BaseTooltipDetail;

  export interface LegendItemHighlightDetail {
    item: LegendItem;
  }
  export interface VisibleItemsChangeDetail {
    items: readonly LegendItem[];
    isApiCall: boolean;
  }
  export interface HighlightChangeDetail {
    point: null | Highcharts.Point;
    group: readonly Highcharts.Point[];
    isApiCall: boolean;
  }
  export interface HighlightClearDetail {
    isApiCall: boolean;
  }

  export type I18nStrings = CartesianI18nStrings & PieI18nStrings;
}

// Utility types

export interface Rect {
  x: number;
  y: number;
  height: number;
  width: number;
}
