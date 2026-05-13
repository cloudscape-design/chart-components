// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

import { useControllableState } from "@cloudscape-design/component-toolkit";

import { InternalCoreChart } from "../core/chart-core";
import { CoreChartProps, ErrorBarSeriesOptions } from "../core/interfaces";
import { getOptionsId, isXThreshold } from "../core/utils";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
import { fireNonCancelableEvent } from "../internal/events";
import { castArray, SomeRequired } from "../internal/utils/utils";
import { transformCartesianSeries } from "./chart-series-cartesian";
import { CartesianChartProps, NonErrorBarSeriesOptions } from "./interfaces";

import testClasses from "./test-classes/styles.css.js";

interface InternalCartesianChartProps extends InternalBaseComponentProps, CartesianChartProps {
  tooltip: SomeRequired<CartesianChartProps.TooltipOptions, "enabled" | "placement" | "size">;
  legend: SomeRequired<CartesianChartProps.LegendOptions, "enabled">;
}

export const InternalCartesianChart = forwardRef(
  ({ tooltip, ...props }: InternalCartesianChartProps, ref: React.Ref<CartesianChartProps.Ref>) => {
    const apiRef = useRef<null | CoreChartProps.ChartAPI>(null);
    const [isZoomed, setIsZoomed] = useState(false);

    // When visibleSeries and onVisibleSeriesChange are provided - the series visibility can be controlled from the outside.
    // Otherwise - the component handles series visibility using its internal state.
    useControllableState(props.visibleSeries, props.onVisibleSeriesChange, undefined, {
      componentName: "CartesianChart",
      propertyName: "visibleSeries",
      changeHandlerName: "onVisibleSeriesChange",
    });
    const allSeriesIds = props.series.map((s) => getOptionsId(s));
    // We keep local visible series state to compute threshold series data, that depends on series visibility.
    const [visibleSeriesLocal, setVisibleSeriesLocal] = useState(props.visibleSeries ?? allSeriesIds);
    const visibleSeriesState = props.visibleSeries ?? visibleSeriesLocal;
    const onVisibleSeriesChange: CoreChartProps["onVisibleItemsChange"] = ({ detail: { items } }) => {
      const visibleSeries = items.filter((i) => i.visible).map((i) => i.id);
      if (props.visibleSeries) {
        fireNonCancelableEvent(props.onVisibleSeriesChange, { visibleSeries });
      } else {
        setVisibleSeriesLocal(visibleSeries);
      }
    };

    // We convert cartesian tooltip options to the core chart's getTooltipContent callback,
    // ensuring no internal types are exposed to the consumer-defined render functions.
    const getTooltipContent: CoreChartProps["getTooltipContent"] = () => {
      // We use point.series.userOptions to get the series options that were passed down to Highcharts,
      // assuming Highcharts makes no modifications for those. These options are not referentially equal
      // to the ones we get from the consumer due to the internal validation/transformation we run on them.
      // See: https://api.highcharts.com/class-reference/Highcharts.Chart#userOptions.
      const transformItem = (item: CoreChartProps.TooltipContentItem): CartesianChartProps.TooltipPointItem => {
        const userOptions = item.point.series.userOptions as NonErrorBarSeriesOptions;
        // Restore original threshold type from custom metadata, since transformCartesianSeries
        // replaces "x-threshold" and "y-threshold" with "line" for Highcharts compatibility.
        const originalType = item.point.series.userOptions.custom?.awsui?.type;
        const series = originalType
          ? ({ ...userOptions, type: originalType } as NonErrorBarSeriesOptions)
          : userOptions;
        return {
          x: item.point.x,
          y: isXThreshold(item.point.series) ? null : (item.point.y ?? null),
          size: item.point.options.z ?? undefined,
          series,
          errorRanges: item.errorRanges.map((point) => ({
            low: point.options.low ?? 0,
            high: point.options.high ?? 0,
            series: point.series.userOptions as ErrorBarSeriesOptions,
          })),
        };
      };
      const transformSeriesProps = (
        props: CoreChartProps.TooltipPointProps,
      ): CartesianChartProps.TooltipPointRenderProps => ({
        item: transformItem(props.item),
      });
      const transformSlotProps = (
        props: CoreChartProps.TooltipSlotProps,
      ): CartesianChartProps.TooltipSlotRenderProps => ({
        x: props.x,
        items: props.items.map(transformItem),
      });

      return {
        point: tooltip.point ? (coreProps) => tooltip.point!(transformSeriesProps(coreProps)) : undefined,
        header: tooltip.header ? (coreProps) => tooltip.header!(transformSlotProps(coreProps)) : undefined,
        body: tooltip.body ? (coreProps) => tooltip.body!(transformSlotProps(coreProps)) : undefined,
        footer: tooltip.footer ? (coreProps) => tooltip.footer!(transformSlotProps(coreProps)) : undefined,
      };
    };

    // Converting x-, and y-threshold series to Highcharts series and plot lines.
    const { series, xPlotLines, yPlotLines } = transformCartesianSeries(props.series, visibleSeriesState);

    // Sync listeners registered via ref.subscribe().
    const syncListenersRef = useRef<CartesianChartProps.SyncListeners | null>(null);

    // Cartesian chart imperative API.
    useImperativeHandle(ref, () => ({
      setVisibleSeries: (visibleSeriesIds) => apiRef.current?.setItemsVisible(visibleSeriesIds),
      showAllSeries: () => apiRef.current?.setItemsVisible(allSeriesIds),
      setCrosshair: (xValue: number) => {
        const chart = apiRef.current?.chart;
        if (!chart || !chart.series.length) {
          return;
        }
        const points = chart.series
          .filter((s) => s.visible && s.points?.length)
          .map((s) => {
            let nearest = s.points[0];
            for (const p of s.points) {
              if (Math.abs(p.x - xValue) < Math.abs(nearest.x - xValue)) {
                nearest = p;
              }
            }
            return nearest;
          })
          .filter(Boolean);
        if (points.length) {
          chart.xAxis[0].drawCrosshair(undefined, points[0]);
        }
      },
      clearCrosshair: () => {
        const chart = apiRef.current?.chart;
        if (!chart) {
          return;
        }
        chart.xAxis[0].hideCrosshair();
      },
      setZoomRange: (startValue: number, endValue: number) => {
        apiRef.current?.chart.xAxis[0].setExtremes(startValue, endValue);
      },
      resetZoom: () => {
        apiRef.current?.chart.xAxis[0].setExtremes(undefined, undefined);
        setIsZoomed(false);
        fireNonCancelableEvent(props.onZoomChange, null);
      },
      highlightSeries: (seriesId: string) => {
        apiRef.current?.highlightItems([seriesId]);
      },
      clearHighlight: () => {
        apiRef.current?.clearChartHighlight();
      },
      subscribe: (listeners: CartesianChartProps.SyncListeners) => {
        syncListenersRef.current = listeners;
        return () => {
          syncListenersRef.current = null;
        };
      },
    }));

    return (
      <InternalCoreChart
        {...props}
        navigator={
          props.zoom?.type && isZoomed && !props.zoom.hideResetButton ? (
            <div role="region" aria-label={props.i18nStrings?.zoomControlsAriaLabel ?? "Chart zoom controls"}>
              <button
                className={testClasses["reset-zoom-button"]}
                onClick={() => {
                  apiRef.current?.chart.xAxis[0].setExtremes(undefined, undefined);
                  setIsZoomed(false);
                  fireNonCancelableEvent(props.onZoomChange, null);
                }}
                aria-label={props.i18nStrings?.resetZoomText ?? "Reset zoom"}
                type="button"
              >
                {props.i18nStrings?.resetZoomText ?? "Reset zoom"}
              </button>
            </div>
          ) : undefined
        }
        callback={(api) => {
          apiRef.current = api;
          // Crosshair sync: mousemove on chart container.
          const chart = api.chart;
          const container = chart.container;
          container.addEventListener("mousemove", (e: MouseEvent) => {
            if (!syncListenersRef.current?.onCrosshairChange) {
              return;
            }
            const normalized = chart.pointer?.normalize(e);
            if (!normalized) {
              return;
            }
            const { chartX, chartY } = normalized;
            const { plotLeft, plotTop, plotWidth, plotHeight } = chart;
            if (
              chartX >= plotLeft &&
              chartX <= plotLeft + plotWidth &&
              chartY >= plotTop &&
              chartY <= plotTop + plotHeight
            ) {
              syncListenersRef.current.onCrosshairChange({ xValue: chart.xAxis[0].toValue(chartX, false) });
            }
          });
          container.addEventListener("mouseleave", () => {
            syncListenersRef.current?.onCrosshairChange?.(null);
          });
        }}
        onLegendItemHighlight={({ detail }) => {
          syncListenersRef.current?.onHighlightChange?.({ seriesId: detail.item.id });
        }}
        onClearHighlight={() => {
          syncListenersRef.current?.onHighlightChange?.(null);
        }}
        onHighlight={({ detail }) => {
          if (detail.isApiCall) {
            return;
          }
          const seriesId = detail.point?.series?.userOptions?.id ?? detail.point?.series?.name;
          if (seriesId) {
            syncListenersRef.current?.onHighlightChange?.({ seriesId });
          }
        }}
        onVisibleItemsChange={(event) => {
          // Existing visibility handling.
          onVisibleSeriesChange(event);
          // Notify sync listeners.
          const visible = event.detail.items.filter((i) => i.visible).map((i) => i.id);
          syncListenersRef.current?.onVisibleSeriesChange?.({ visibleSeries: visible });
        }}
        options={{
          chart: {
            inverted: props.inverted,
            ...(props.zoom?.type
              ? {
                  zooming: { type: props.zoom.type ?? "x" },
                  resetZoomButton: { theme: { style: { display: "none" } } },
                }
              : {}),
          },
          plotOptions: {
            series: {
              stacking: props.stacking,
            },
          },
          navigator: props.chartNavigator?.enabled
            ? { enabled: true, height: props.chartNavigator.height ?? 40, adaptToUpdatedData: true }
            : { enabled: false },
          scrollbar: { enabled: false },
          rangeSelector: { enabled: false },
          series: series.map((s) => ({ ...s, showInNavigator: !!props.chartNavigator?.enabled })),
          xAxis: castArray(props.xAxis)?.map((xAxisProps) => ({
            ...xAxisProps,
            title: { text: xAxisProps.title },
            plotLines: xPlotLines,
            crosshair: true,
            events: {
              afterSetExtremes(e: { min: number; max: number; trigger?: string; userMin?: number; userMax?: number }) {
                if (e.trigger === "navigator" || e.trigger === "zoom") {
                  const isReset = !e.userMin && !e.userMax;
                  setIsZoomed(!isReset);
                  syncListenersRef.current?.onZoomChange?.(isReset ? null : { startValue: e.min, endValue: e.max });
                  fireNonCancelableEvent(props.onZoomChange, isReset ? null : { startValue: e.min, endValue: e.max });
                }
              },
            },
          })),
          yAxis: castArray(props.yAxis)?.map((yAxisProps, index) => ({
            ...yAxisProps,
            title: { text: yAxisProps.title },
            plotLines: yPlotLines,
            ...(index === 1 ? { opposite: true } : {}),
          })),
        }}
        sizeAxis={props.sizeAxis}
        tooltip={tooltip}
        getTooltipContent={getTooltipContent}
        visibleItems={props.visibleSeries}
        className={testClasses.root}
      />
    );
  },
);
