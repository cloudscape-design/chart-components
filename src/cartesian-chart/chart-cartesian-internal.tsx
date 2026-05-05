// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";

import { useControllableState } from "@cloudscape-design/component-toolkit";
import LiveRegion from "@cloudscape-design/components/live-region";

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
    const [liveAnnouncement, setLiveAnnouncement] = useState("");
    const resetButtonRef = useRef<HTMLButtonElement>(null);

    // When visibleSeries and onVisibleSeriesChange are provided - the series visibility can be controlled from the outside.
    // Otherwise - the component handles series visibility using its internal state.
    useControllableState(props.visibleSeries, props.onVisibleSeriesChange, undefined, {
      componentName: "CartesianChart",
      propertyName: "visibleSeries",
      changeHandlerName: "onVisibleSeriesChange",
    });
    const allSeriesIds = props.series.map((s) => getOptionsId(s));
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

    // i18n defaults for zoom and navigator.
    const i18n = {
      resetZoomText: props.i18nStrings?.resetZoomText ?? "Reset zoom",
      zoomLiveAnnouncementText:
        props.i18nStrings?.zoomLiveAnnouncementText ??
        "Chart zoomed in. Use the reset zoom button to restore the full range.",
      zoomResetLiveAnnouncementText:
        props.i18nStrings?.zoomResetLiveAnnouncementText ?? "Zoom reset. Showing all data.",
      navigatorAriaLabel:
        props.i18nStrings?.navigatorAriaLabel ?? "Use handles to adjust the time range displayed in the chart",
      navigatorHandleAriaLabel: props.i18nStrings?.navigatorHandleAriaLabel ?? "Navigator handle",
      navigatorChangeAnnouncementText:
        props.i18nStrings?.navigatorChangeAnnouncementText ??
        ((axisRangeDescription: string) => `Range changed: ${axisRangeDescription}`),
      zoomControlsAriaLabel: props.i18nStrings?.zoomControlsAriaLabel ?? "Chart zoom controls",
    };

    const resetZoom = useCallback(() => {
      apiRef.current?.chart.xAxis[0].setExtremes(undefined, undefined);
      setIsZoomed(false);
      setLiveAnnouncement(i18n.zoomResetLiveAnnouncementText);
      fireNonCancelableEvent(props.onZoomChange, null);
    }, [i18n.zoomResetLiveAnnouncementText, props.onZoomChange]);

    const announceZoom = useCallback(
      (zoomed: boolean) => {
        setLiveAnnouncement(zoomed ? i18n.zoomLiveAnnouncementText : "");
      },
      [i18n.zoomLiveAnnouncementText],
    );

    // Focus the reset button when it appears after a zoom action.
    useEffect(() => {
      if (isZoomed && resetButtonRef.current) {
        resetButtonRef.current.focus();
      }
    }, [isZoomed]);

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

    // Cartesian chart imperative API.
    useImperativeHandle(ref, () => ({
      setVisibleSeries: (visibleSeriesIds) => apiRef.current?.setItemsVisible(visibleSeriesIds),
      showAllSeries: () => apiRef.current?.setItemsVisible(allSeriesIds),
    }));

    const zoomEnabled = !!props.zoom?.type;
    const navigatorEnabled = !!props.chartNavigator?.enabled;

    // Navigator slot: reset zoom button + Cloudscape LiveRegion for zoom announcements.
    const navigatorSlot =
      zoomEnabled || navigatorEnabled ? (
        <div role="region" aria-label={i18n.zoomControlsAriaLabel}>
          <LiveRegion>{liveAnnouncement}</LiveRegion>
          {zoomEnabled && isZoomed && (
            <div style={{ marginBlockStart: 4 }}>
              <button ref={resetButtonRef} onClick={resetZoom} aria-label={i18n.resetZoomText} type="button">
                {i18n.resetZoomText}
              </button>
            </div>
          )}
        </div>
      ) : null;

    // Highcharts Stock options (navigator, scrollbar, rangeSelector) passed through the options object.
    const stockOptions = navigatorEnabled
      ? {
          navigator: {
            enabled: true,
            height: props.chartNavigator!.height ?? 40,
            adaptToUpdatedData: true,
            accessibility: { enabled: true },
          },
          scrollbar: { enabled: false },
          rangeSelector: { enabled: false },
          lang: {
            accessibility: {
              navigator: {
                groupLabel: i18n.navigatorAriaLabel,
                handleLabel: i18n.navigatorHandleAriaLabel,
                changeAnnouncement: i18n.navigatorChangeAnnouncementText("{axisRangeDescription}"),
              },
            },
          },
        }
      : { navigator: { enabled: false }, scrollbar: { enabled: false }, rangeSelector: { enabled: false } };

    return (
      <InternalCoreChart
        {...props}
        navigator={navigatorSlot}
        callback={(api) => (apiRef.current = api)}
        options={{
          chart: {
            inverted: props.inverted,
            ...(zoomEnabled
              ? {
                  zooming: { type: props.zoom!.type ?? "x" },
                  // Hide the default Highcharts "Reset zoom" button — we render our own accessible one.
                  resetZoomButton: { theme: { style: { display: "none" } } },
                }
              : {}),
          },
          plotOptions: {
            series: { stacking: props.stacking },
          },
          accessibility: {
            enabled: true,
            keyboardNavigation: { enabled: true },
          },
          series: series.map((s) => ({
            ...s,
            showInNavigator: navigatorEnabled,
          })),
          xAxis: castArray(props.xAxis)?.map((xAxisProps) => ({
            ...xAxisProps,
            title: { text: xAxisProps.title },
            plotLines: xPlotLines,
            ...(zoomEnabled || navigatorEnabled
              ? {
                  events: {
                    afterSetExtremes(e: {
                      min: number;
                      max: number;
                      trigger?: string;
                      userMin?: number;
                      userMax?: number;
                    }) {
                      if (e.trigger === "navigator" || e.trigger === "zoom") {
                        const zoomed = !!(e.userMin || e.userMax);
                        setIsZoomed(zoomed);
                        announceZoom(zoomed);
                        if (zoomed) {
                          fireNonCancelableEvent(props.onZoomChange, {
                            startValue: e.min,
                            endValue: e.max,
                          });
                        } else {
                          fireNonCancelableEvent(props.onZoomChange, null);
                        }
                      }
                    },
                  },
                }
              : {}),
          })),
          yAxis: castArray(props.yAxis)?.map((yAxisProps, index) => ({
            ...yAxisProps,
            title: { text: yAxisProps.title },
            plotLines: yPlotLines,
            ...(index === 1 ? { opposite: true } : {}),
          })),
          ...stockOptions,
        }}
        sizeAxis={props.sizeAxis}
        tooltip={tooltip}
        getTooltipContent={getTooltipContent}
        visibleItems={props.visibleSeries}
        onVisibleItemsChange={onVisibleSeriesChange}
        className={testClasses.root}
      />
    );
  },
);
