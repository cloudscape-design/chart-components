// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useImperativeHandle, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type Highcharts from "highcharts";

import { useControllableState } from "@cloudscape-design/component-toolkit";

import { CloudscapeHighcharts } from "../core/chart-core";
import { LegendTooltipProps } from "../core/interfaces-core";
import { getOptionsId } from "../core/utils";
import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { fireNonCancelableEvent, NonCancelableEventHandler } from "../internal/events";
import { useChartTooltipPie } from "./chart-tooltip-pie";
import { InternalPieChartOptions, PieChartProps } from "./interfaces-pie";
import * as Styles from "./styles";

import testClasses from "./test-classes/styles.css.js";

interface InternalPieChartProps {
  highcharts: null | typeof Highcharts;
  options: InternalPieChartOptions;
  tooltip?: PieChartProps.TooltipProps;
  legendTooltip?: LegendTooltipProps;
  segment?: PieChartProps.SegmentProps;
  noData?: PieChartProps.NoDataProps;
  visibleSegments?: string[];
  onToggleVisibleSegment?: NonCancelableEventHandler<{ visibleSegments: string[] }>;
  innerValue?: string;
  innerDescription?: string;
}

/**
 * The InternalPieChart component is a wrapper for CloudscapeHighcharts that implements default tooltip content,
 * adds segment detail, inner title and description.
 */
export const InternalPieChart = forwardRef(
  ({ highcharts, ...props }: InternalPieChartProps, ref: React.Ref<PieChartProps.Ref>) => {
    const chartRef = useRef<Highcharts.Chart>(null) as React.MutableRefObject<Highcharts.Chart>;
    const getChart = () => {
      /* c8 ignore next */
      if (!chartRef.current) {
        throw new Error("Invariant violation: chart instance is not available.");
      }
      return chartRef.current;
    };

    // Obtaining tooltip content, specific for pie charts.
    // By default, it renders the selected content name, and allows to extend and override its contents.
    const tooltipProps = useChartTooltipPie(getChart, props);

    // When visibleSegments and onToggleVisibleSegment are provided - the segments visibility can be controlled from the outside.
    // Otherwise - the component handles segments visibility using its internal state.
    const [visibleSegmentsState, setVisibleSegments] = useControllableState(
      props.visibleSegments,
      props.onToggleVisibleSegment,
      null,
      {
        componentName: "PieChart",
        propertyName: "visibleSegments",
        changeHandlerName: "onToggleVisibleSegment",
      },
      (value, handler) => fireNonCancelableEvent(handler, { visibleSegments: value ?? [] }),
    );
    const allSegmentIds = props.options.series.flatMap((s) => {
      const itemIds: string[] = [];
      if ("data" in s && Array.isArray(s.data)) {
        for (const dataItem of s.data) {
          if (dataItem && typeof dataItem === "object" && "id" in dataItem && "name" in dataItem) {
            itemIds.push(getOptionsId(dataItem));
          }
        }
      }
      return itemIds;
    });
    const visibleSegments = visibleSegmentsState ?? allSegmentIds;
    const hiddenSegments = allSegmentIds.filter((id) => !visibleSegments.includes(id));

    const series: Highcharts.SeriesOptionsRegistry["SeriesPieOptions"][] = [];
    for (const s of props.options.series) {
      if (s.type === "pie") {
        series.push({ ...s });
      }
      if (s.type === "awsui-donut") {
        series.push({ ...s, type: "pie", innerSize: "80%" });
      }
    }

    useImperativeHandle(ref, () => ({
      // The clear filter API allows to programmatically make all segments visible, even when the controllable
      // visibility API is not used. This can be used for a custom clear-filter action of the no-match state or elsewhere.
      clearFilter() {
        setVisibleSegments(allSegmentIds);
      },
    }));

    const innerValueRef = useRef<null | Highcharts.SVGElement>(null);
    const innerDescriptionRef = useRef<null | Highcharts.SVGElement>(null);

    // The Highcharts options takes all provided Highcharts options and custom properties and merges them together, so that
    // the Cloudscape features and custom Highcharts extensions can co-exist.
    const highchartsOptions: Highcharts.Options = {
      ...props.options,
      chart: {
        ...props.options.chart,
        events: {
          ...props.options.chart?.events,
          render(event) {
            if (highcharts && event.target instanceof highcharts.Chart) {
              (event.target as any).colorCounter = props.options.series.length;

              const nVisibleSeries = event.target.series.filter(
                (s) => s.visible && (s.type !== "pie" || s.data.some((d) => d.y !== null && d.visible)),
              ).length;

              if (innerValueRef.current) {
                innerValueRef.current.destroy();
              }
              if (innerDescriptionRef.current) {
                innerDescriptionRef.current.destroy();
              }
              if (nVisibleSeries > 0 && event.target.series[0].type === "pie") {
                const chart = event.target;
                const textX = chart.plotLeft + chart.series[0].center[0];
                const textY = chart.plotTop + chart.series[0].center[1];

                if (props.innerValue) {
                  innerValueRef.current = chart.renderer
                    .text(props.innerValue, textX, textY)
                    .attr({ zIndex: 5 })
                    .css(Styles.donutInnerValueCss)
                    .add();

                  innerValueRef.current.attr({
                    x: textX - innerValueRef.current.getBBox().width / 2,
                    y: props.innerDescription ? textY : textY + 10,
                  });
                }
                if (props.innerDescription) {
                  innerDescriptionRef.current = chart.renderer
                    .text(props.innerDescription, textX, textY)
                    .attr({ zIndex: 5 })
                    .css(Styles.donutInnerDescriptionCss)
                    .add();

                  innerDescriptionRef.current.attr({
                    x: textX - innerDescriptionRef.current.getBBox().width / 2,
                    y: textY + 20,
                  });
                }
              }
            }

            props.options.chart?.events?.render?.call(this, event);
          },
        },
      },
      plotOptions: {
        ...props.options.plotOptions,
        pie: {
          ...props.options.plotOptions?.pie,
          showInLegend: true,
          dataLabels: {
            position: "left",
            formatter() {
              const segmentProps = {
                totalValue: this.total ?? 0,
                segmentValue: this.y ?? 0,
                segmentId: this.options.id,
                segmentName: this.options.name ?? "",
              };
              const title = props.segment?.title === null ? null : (props.segment?.title?.(segmentProps) ?? this.name);
              const description = props.segment?.description?.(segmentProps);
              if (title || description) {
                return renderToStaticMarkup(
                  <text>
                    {title ? <tspan>{this.name}</tspan> : null}
                    <br />
                    {description ? <tspan style={Styles.segmentDescriptionCss}>{description}</tspan> : null}
                  </text>,
                );
              }
              return null;
            },
            useHTML: false,
            ...props.options.plotOptions?.pie?.dataLabels,
          },
        },
      },
      series,
    };

    return (
      <CloudscapeHighcharts
        highcharts={highcharts}
        options={highchartsOptions}
        tooltip={tooltipProps}
        legendTooltip={props.legendTooltip}
        noData={props.noData}
        legendMarkers={{}}
        hiddenItems={hiddenSegments}
        onLegendItemClick={(itemId, visible) => {
          const nextState = visible ? [...visibleSegments, itemId] : visibleSegments.filter((id) => id !== itemId);
          setVisibleSegments(nextState);
          return false;
        }}
        className={testClasses.root}
        callback={(chart) => {
          chartRef.current = chart;
        }}
        {...getDataAttributes(props)}
      />
    );
  },
);
