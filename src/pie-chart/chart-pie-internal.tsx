// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useImperativeHandle, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type Highcharts from "highcharts";

import { useControllableState } from "@cloudscape-design/component-toolkit";

import { CloudscapeHighcharts } from "../core/chart-core";
import { CoreChartAPI } from "../core/interfaces-core";
import { getOptionsId } from "../core/utils";
import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { fireNonCancelableEvent } from "../internal/events";
import { useChartTooltipPie } from "./chart-tooltip-pie";
import { InternalPieChartOptions, PieChartProps } from "./interfaces-pie";
import * as Styles from "./styles";

import testClasses from "./test-classes/styles.css.js";

interface InternalPieChartProps extends Omit<PieChartProps, "series"> {
  highcharts: null | object;
  options: InternalPieChartOptions;
}

/**
 * The InternalPieChart component is a wrapper for CloudscapeHighcharts that implements default tooltip content,
 * adds segment detail, inner title and description.
 */
export const InternalPieChart = forwardRef((props: InternalPieChartProps, ref: React.Ref<PieChartProps.Ref>) => {
  const highcharts = props.highcharts as null | typeof Highcharts;
  const apiRef = useRef<CoreChartAPI>(null) as React.MutableRefObject<CoreChartAPI>;
  const getAPI = () => {
    /* c8 ignore next */
    if (!apiRef.current) {
      throw new Error("Invariant violation: chart instance is not available.");
    }
    return apiRef.current;
  };

  // Obtaining tooltip content, specific for pie charts.
  // By default, it renders the selected content name, and allows to extend and override its contents.
  const tooltipProps = useChartTooltipPie(getAPI, props);

  // When visibleSegments and onChangeVisibleSegments are provided - the segments visibility can be controlled from the outside.
  // Otherwise - the component handles segments visibility using its internal state.
  const [visibleSegmentsState, setVisibleSegments] = useControllableState(
    props.visibleSegments,
    props.onChangeVisibleSegments,
    null,
    {
      componentName: "PieChart",
      propertyName: "visibleSegments",
      changeHandlerName: "onChangeVisibleSegments",
    },
    (value, handler) => fireNonCancelableEvent(handler, { visibleSegments: value ? [...value] : [] }),
  );
  const allSegmentIds = props.options.series.flatMap((s) => {
    const itemIds: string[] = [];
    if ("data" in s && Array.isArray(s.data)) {
      for (const dataItem of s.data) {
        const id = getOptionsId(dataItem as any);
        if (id) {
          itemIds.push(id);
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
    if (s.type === "donut") {
      series.push({ ...s, type: "pie", innerSize: "80%" });
    }
  }

  useImperativeHandle(ref, () => ({
    setVisibleSegments: setVisibleSegments,
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
        showInLegend: true,
        borderWidth: Styles.segmentBorderWidth,
        ...props.options.plotOptions?.pie,
        dataLabels: {
          position: "left",
          formatter() {
            if (!props.segmentOptions) {
              return null;
            }
            const { title: renderTitle, description: renderDescription } = props.segmentOptions;
            const segmentProps = {
              totalValue: this.total ?? 0,
              segmentValue: this.y ?? 0,
              segmentId: this.options.id,
              segmentName: this.options.name ?? "",
            };
            const title = renderTitle === null ? null : (renderTitle?.(segmentProps) ?? this.name);
            const description = renderDescription?.(segmentProps);
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
      fitHeight={props.fitHeight}
      chartMinHeight={props.chartMinHeight}
      chartMinWidth={props.chartMinWidth}
      tooltip={tooltipProps}
      noData={props.noData}
      legend={props.legend}
      hiddenItems={hiddenSegments}
      onItemVisibilityChange={(hiddenSegments) => {
        const nextVisibleSegments = allSegmentIds.filter((id) => !hiddenSegments.includes(id));
        setVisibleSegments(nextVisibleSegments);
      }}
      header={props.header}
      footer={props.footer}
      filter={props.filter}
      className={testClasses.root}
      callback={(chart) => {
        apiRef.current = chart;
      }}
      {...getDataAttributes(props)}
    />
  );
});
