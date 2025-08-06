/* eslint-disable */

// This file includes all TS annotations to be parsed by agentic AI.

 /// <reference types="react" />
import * as react from 'react';

type NonCancelableEventHandler<Detail = {}> = (event: NonCancelableCustomEvent<Detail>) => void;
type NonCancelableCustomEvent<DetailType> = Omit<CustomEvent<DetailType>, "preventDefault">;

/**
 * This interface includes common public chart properties, applicable for all chart types.
 */
interface BaseChartOptions {
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
interface BaseLegendOptions {
    enabled?: boolean;
    title?: string;
    actions?: React.ReactNode;
}
interface BaseNoDataOptions {
    statusType?: "finished" | "loading" | "error";
    empty?: React.ReactNode;
    error?: React.ReactNode;
    loading?: React.ReactNode;
    noMatch?: React.ReactNode;
    onRecoveryClick?: NonCancelableEventHandler;
}
interface BaseTooltipDetail {
    key: React.ReactNode;
    value: React.ReactNode;
}
interface BaseI18nStrings {
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
interface WithCartesianI18nStrings {
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
interface WithPieI18nStrings {
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
interface CartesianI18nStrings extends BaseI18nStrings {
    xAxisRoleDescription?: string;
    yAxisRoleDescription?: string;
}
interface PieI18nStrings extends BaseI18nStrings {
    segmentRoleDescription?: string;
}
interface BaseFilterOptions {
    seriesFilter?: boolean;
    additionalFilters?: React.ReactNode;
}
interface BaseTooltipPointFormatted {
    key?: React.ReactNode;
    value?: React.ReactNode;
    description?: React.ReactNode;
    expandable?: boolean;
    subItems?: ReadonlyArray<{
        key: React.ReactNode;
        value: React.ReactNode;
    }>;
}
interface AreaSeriesOptions extends BaseCartesianSeriesOptions {
    type: "area";
    data: readonly PointDataItemType[];
}
interface AreaSplineSeriesOptions extends BaseCartesianSeriesOptions {
    type: "areaspline";
    data: readonly PointDataItemType[];
}
interface ColumnSeriesOptions extends BaseCartesianSeriesOptions {
    type: "column";
    data: readonly PointDataItemType[];
}
interface LineSeriesOptions extends BaseCartesianSeriesOptions {
    type: "line";
    data: readonly PointDataItemType[];
}
interface SplineSeriesOptions extends BaseCartesianSeriesOptions {
    type: "spline";
    data: readonly PointDataItemType[];
}
interface ScatterSeriesOptions extends BaseCartesianSeriesOptions {
    type: "scatter";
    data: readonly PointDataItemType[];
    marker?: PointMarkerOptions;
}
interface ErrorBarSeriesOptions extends Omit<BaseCartesianSeriesOptions, "name"> {
    type: "errorbar";
    name?: string;
    data: readonly RangeDataItemOptions[];
    linkedTo: string;
}
interface XThresholdSeriesOptions extends BaseCartesianSeriesOptions {
    type: "x-threshold";
    value: number;
}
interface YThresholdSeriesOptions extends BaseCartesianSeriesOptions {
    type: "y-threshold";
    value: number;
}
interface PieSeriesOptions extends BaseCartesianSeriesOptions {
    type: "pie";
    data: readonly PieSegmentOptions[];
}
interface DonutSeriesOptions extends BaseCartesianSeriesOptions {
    type: "donut";
    data: readonly PieSegmentOptions[];
}
interface PieSegmentOptions {
    y: number | null;
    id?: string;
    name: string;
    color?: string;
}
type PointDataItemType = null | number | PointDataItemOptions;
interface PointDataItemOptions {
    x?: number;
    y: number | null;
}
interface RangeDataItemOptions {
    x?: number;
    low: number;
    high: number;
}
interface BaseCartesianSeriesOptions {
    id?: string;
    name: string;
    color?: string;
}
interface PointMarkerOptions {
    symbol?: "circle" | "diamond" | "square" | "triangle" | "triangle-down";
}
interface CoreCartesianOptions {
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

interface CartesianChartProps extends BaseChartOptions, CoreCartesianOptions, WithCartesianI18nStrings {
    /**
     * Inverts X and Y axes. Use it to show horizontal columns (bars).
     * This property corresponds to [chart.inverted](https://api.highcharts.com/highcharts/chart.inverted).
     */
    inverted?: boolean;
    /**
     * Enables series stacking behavior. Use it for column- or area- series.
     * This property corresponds to "normal" stacking type in Highcharts ([plotOptions.series.stacking](https://api.highcharts.com/highcharts/plotOptions.series.stacking)).
     */
    stacking?: "normal";
    /**
     * Defines series options of the chart.
     * This property corresponds to [series](https://api.highcharts.com/highcharts/series), and extends it
     * with two additional series types: "x-threshold", and "y-threshold".
     *
     * Supported types:
     * * [area](https://api.highcharts.com/highcharts/series.area).
     * * [areaspline](https://api.highcharts.com/highcharts/series.areaspline).
     * * [column](https://api.highcharts.com/highcharts/series.column).
     * * [errorbar](https://api.highcharts.com/highcharts/series.errorbar) - requires "highcharts/highcharts-more" module.
     * * [line](https://api.highcharts.com/highcharts/series.line).
     * * [scatter](https://api.highcharts.com/highcharts/series.scatter).
     * * [spline](https://api.highcharts.com/highcharts/series.spline).
     * * x-threshold - The line-like series to represent x-axis threshold (vertical, when `inverted=false`).
     * * y-threshold - The line-like series to represent y-axis threshold (horizontal, when `inverted=false`).
     */
    series: readonly CartesianChartProps.SeriesOptions[];
    /**
     * Defines tooltip options of the chart, including:
     * * `enabled` - (optional, boolean) - Hides the tooltip when set to false.
     * * `size` - (optional, "small" | "medium" | "large") - Specifies max tooltip size.
     * * `placement` - (optional, "middle" | "outside") - Specifies preferred tooltip placement.
     * * `point` - (optional, function) - Customizes tooltip series point rendering.
     * * `header` - (optional, function) - Renders a custom tooltip header.
     * * `body` - (optional, function) - Renders a custom tooltip body.
     * * `footer` - (optional, function) - Renders a custom tooltip footer.
     */
    tooltip?: CartesianChartProps.TooltipOptions;
    /**
     * Defines options of the chart's x axis.
     * This property corresponds to [xAxis](https://api.highcharts.com/highcharts/xAxis), and extends it
     * with a custom value formatter.
     *
     * Supported options:
     * * `title` (optional, string) - Axis title.
     * * `type` (optional, "linear" | "datetime" | "category" | "logarithmic") - Axis type.
     * * * "linear" - Uses continuous proportional values scale.
     * * * "datetime" - Similar to linear, but takes epoch time as values.
     * * * "category" - Uses discrete scale, requires `categories` to be set.
     * * * "logarithmic" - Uses continuous logarithmic values scale.
     * * `min` (optional, number) - Axis min value boundary.
     * * `max` (optional, number) - Axis max value boundary.
     * * `tickInterval` (optional, number) - Distance between axis ticks.
     * * `categories` (optional, Array<string>) - Predefined list of values, used for categorical axis type.
     * * `valueFormatter` (optional, function) - Takes axis tick as input and returns a formatted string. This formatter also
     * applies to the tooltip header.
     */
    xAxis?: CartesianChartProps.XAxisOptions;
    /**
     * Defines options of the chart's y axis.
     * This property corresponds to [xAxis](https://api.highcharts.com/highcharts/yAxis), and extends it
     * with a custom value formatter.
     *
     * Supported options:
     * * `title` (optional, string) - Axis title.
     * * `type` (optional, "linear" | "datetime" | "category" | "logarithmic") - Axis type.
     * * * "linear" - Uses continuous proportional values scale.
     * * * "datetime" - Similar to linear, but takes epoch time as values.
     * * * "category" - Uses discrete scale, requires `categories` to be set.
     * * * "logarithmic" - Uses continuous logarithmic values scale.
     * * `min` (optional, number) - Axis min value boundary.
     * * `max` (optional, number) - Axis max value boundary.
     * * `tickInterval` (optional, number) - Distance between axis ticks.
     * * `categories` (optional, Array<string>) - Predefined list of values, used for categorical axis type.
     * * `reversedStacks` (optional, boolean) - Reverts series order in stacked series.
     * * `valueFormatter` (optional, function) - Takes axis tick as input and returns a formatted string. This formatter also
     * applies to the tooltip points values.
     */
    yAxis?: CartesianChartProps.YAxisOptions;
    /**
     * Specifies which series to show using their IDs. By default, all series are visible and managed by the component.
     * If a series doesn't have an ID, its name is used. When using this property, manage state updates with `onVisibleSeriesChange`.
     */
    visibleSeries?: readonly string[];
    /**
     * A callback function, triggered when series visibility changes as a result of user interaction with the legend or filter.
     */
    onVisibleSeriesChange?: NonCancelableEventHandler<{
        visibleSeries: string[];
    }>;
}
declare namespace CartesianChartProps {
    export interface Ref {
        /**
         * Controls series visibility and works with both controlled and uncontrolled visibility modes.
         */
        setVisibleSeries(visibleSeries: readonly string[]): void;
        /**
         * Functions similarly to `setVisibleSeries`, but applies to all series and doesn't require series IDs as input.
         * Use this when implementing clear-filter actions in no-match states.
         */
        showAllSeries(): void;
    }
    export type SeriesOptions = AreaSeriesOptions | AreaSplineSeriesOptions | ColumnSeriesOptions | ErrorBarSeriesOptions | LineSeriesOptions | ScatterSeriesOptions | SplineSeriesOptions | XThresholdSeriesOptions | YThresholdSeriesOptions;
    export type AreaSeriesOptions = AreaSeriesOptions;
    export type AreaSplineSeriesOptions = AreaSplineSeriesOptions;
    export type ColumnSeriesOptions = ColumnSeriesOptions;
    export type ErrorBarSeriesOptions = ErrorBarSeriesOptions;
    export type LineSeriesOptions = LineSeriesOptions;
    export type ScatterSeriesOptions = ScatterSeriesOptions;
    export type SplineSeriesOptions = SplineSeriesOptions;
    export type XThresholdSeriesOptions = XThresholdSeriesOptions;
    export type YThresholdSeriesOptions = YThresholdSeriesOptions;
    interface AxisOptions {
        title?: string;
        type?: "linear" | "datetime" | "category" | "logarithmic";
        min?: number;
        max?: number;
        tickInterval?: number;
        categories?: string[];
        valueFormatter?: (value: null | number) => string;
    }
    export type XAxisOptions = AxisOptions;
    export interface YAxisOptions extends AxisOptions {
        reversedStacks?: boolean;
    }
    export interface TooltipOptions {
        enabled?: boolean;
        placement?: "middle" | "outside";
        size?: "small" | "medium" | "large";
        point?: (props: TooltipPointRenderProps) => TooltipPointFormatted;
        header?: (props: TooltipHeaderRenderProps) => React.ReactNode;
        body?: (props: TooltipBodyRenderProps) => React.ReactNode;
        footer?: (props: TooltipFooterRenderProps) => React.ReactNode;
    }
    export type TooltipHeaderRenderProps = TooltipSlotRenderProps;
    export type TooltipBodyRenderProps = TooltipSlotRenderProps;
    export type TooltipFooterRenderProps = TooltipSlotRenderProps;
    export interface TooltipSlotRenderProps {
        x: number;
        items: TooltipPointItem[];
    }
    export interface TooltipPointRenderProps {
        item: TooltipPointItem;
    }
    export interface TooltipPointItem {
        x: number;
        y: number | null;
        errorRanges: {
            low: number;
            high: number;
            series: CartesianChartProps.ErrorBarSeriesOptions;
        }[];
        series: NonErrorBarSeriesOptions;
    }
    export type TooltipPointFormatted = BaseTooltipPointFormatted;
    export type LegendOptions = BaseLegendOptions;
    export type FilterOptions = BaseFilterOptions;
    export type NoDataOptions = BaseNoDataOptions;
    export {};
}
type NonErrorBarSeriesOptions = Exclude<CartesianChartProps.SeriesOptions, CartesianChartProps.ErrorBarSeriesOptions>;

declare const CartesianChart: react.ForwardRefExoticComponent<CartesianChartProps & react.RefAttributes<CartesianChartProps.Ref>>;

interface PieChartProps extends BaseChartOptions, WithPieI18nStrings {
    /**
     * Defines series options of the chart.
     * This property corresponds to [series](https://api.highcharts.com/highcharts/series), and extends it
     * with an additional "donut" series type.
     *
     * Supported series types:
     * * [pie](https://api.highcharts.com/highcharts/series.pie).
     * * donut - the pie series with predefined inner radius.
     */
    series: null | PieChartProps.SeriesOptions;
    /**
     * Defines tooltip options of the chart, including:
     * * `enabled` - (optional, boolean) - Hides the tooltip when set to false.
     * * `size` - (optional, "small" | "medium" | "large") - Specifies max tooltip size.
     * * `details` - (optional, function) - Provides a list of key-value pairs as tooltip's body.
     * * `header` - (optional, function) - Renders a custom tooltip header.
     * * `body` - (optional, function) - Renders a custom tooltip body.
     * * `footer` - (optional, function) - Renders a custom tooltip footer.
     */
    tooltip?: PieChartProps.TooltipOptions;
    /**
     * Specifies which segments to show using their IDs. By default, all segments are visible and managed by the component.
     * If a segment doesn't have an ID, its name is used. When using this property, manage state updates with `onVisibleSegmentsChange`.
     */
    visibleSegments?: readonly string[];
    /**
     * A callback function, triggered when segments visibility changes as a result of user interaction with the legend or filter.
     */
    onVisibleSegmentsChange?: NonCancelableEventHandler<{
        visibleSegments: string[];
    }>;
    /**
     * A function that determines the title of a segment displayed on the chart. The title appears above the segment
     * description defined by `segmentDescription`. By default, it displays the segment name. You can hide the title
     * by returning an empty string from the function.
     */
    segmentTitle?: (props: PieChartProps.SegmentTitleRenderProps) => string;
    /**
     * A function determining the segment description displayed on the chart below the segment title.
     */
    segmentDescription?: (props: PieChartProps.SegmentDescriptionRenderProps) => string;
    /**
     * Title displayed in the donut chart's inner area.
     */
    innerAreaTitle?: string;
    /**
     * Description text displayed in the donut chart's inner area.
     */
    innerAreaDescription?: string;
}
declare namespace PieChartProps {
    export interface Ref {
        /**
         * Controls segments visibility and works with both controlled and uncontrolled visibility modes.
         */
        setVisibleSegments(visibleSegments: readonly string[]): void;
        /**
         * Functions similarly to `setVisibleSeries`, but applies to all series and doesn't require series IDs as input.
         * Use this when implementing clear-filter actions in no-match states.
         */
        showAllSegments(): void;
    }
    export type SeriesOptions = PieSeriesOptions | DonutSeriesOptions;
    export type PieSeriesOptions = PieSeriesOptions;
    export type DonutSeriesOptions = DonutSeriesOptions;
    export type PieSegmentOptions = PieSegmentOptions;
    export interface TooltipOptions {
        enabled?: boolean;
        size?: "small" | "medium" | "large";
        details?: (props: TooltipDetailsRenderProps) => readonly TooltipDetail[];
        header?: (props: TooltipHeaderRenderProps) => React.ReactNode;
        body?: (props: TooltipBodyRenderProps) => React.ReactNode;
        footer?: (props: TooltipFooterRenderProps) => React.ReactNode;
    }
    export type TooltipDetailsRenderProps = TooltipSlotRenderProps;
    export type TooltipHeaderRenderProps = TooltipSlotRenderProps;
    export type TooltipBodyRenderProps = TooltipSlotRenderProps;
    export type TooltipFooterRenderProps = TooltipSlotRenderProps;
    interface TooltipSlotRenderProps {
        segmentId?: string;
        segmentName: string;
        segmentValue: number;
        totalValue: number;
    }
    export type TooltipDetail = BaseTooltipDetail;
    export type SegmentTitleRenderProps = SegmentDescriptionRenderProps;
    export interface SegmentDescriptionRenderProps {
        segmentId?: string;
        segmentName: string;
        segmentValue: number;
        totalValue: number;
    }
    export type LegendOptions = BaseLegendOptions;
    export type FilterOptions = BaseFilterOptions;
    export type NoDataOptions = BaseNoDataOptions;
    export {};
}

declare const PieChart: react.ForwardRefExoticComponent<PieChartProps & react.RefAttributes<PieChartProps.Ref>>;

export { CartesianChart, CartesianChartProps, PieChart, PieChartProps };
