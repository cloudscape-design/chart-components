// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useImperativeHandle, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type Highcharts from "highcharts";

import { useControllableState } from "@cloudscape-design/component-toolkit";

import { InternalCoreChart } from "../core/chart-core";
import { CoreChartAPI, CoreChartProps, TooltipSlotProps } from "../core/interfaces";
import { getOptionsId } from "../core/utils";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
import * as Styles from "../internal/chart-styles";
import ChartSeriesDetails from "../internal/components/series-details";
import { fireNonCancelableEvent } from "../internal/events";
import { SomeRequired, Writeable } from "../internal/utils/utils";
import { useInnerArea } from "./chart-inner-area";
import { PieChartProps } from "./interfaces";

import testClasses from "./test-classes/styles.css.js";

interface InternalPieChartProps extends InternalBaseComponentProps, Omit<PieChartProps, "series"> {
  series: readonly PieChartProps.SeriesOptions[];
  tooltip: SomeRequired<PieChartProps.TooltipOptions, "enabled" | "size">;
  legend: SomeRequired<PieChartProps.LegendOptions, "enabled">;
}

export const InternalPieChart = forwardRef(
  ({ series: originalSeries, tooltip, ...props }: InternalPieChartProps, ref: React.Ref<PieChartProps.Ref>) => {
    const apiRef = useRef<null | CoreChartAPI>(null);

    // When visibleSegments and onVisibleSegmentsChange are provided - the segments visibility can be controlled from the outside.
    // Otherwise - the component handles segments visibility using its internal state.
    useControllableState(props.visibleSegments, props.onVisibleSegmentsChange, undefined, {
      componentName: "PieChart",
      propertyName: "visibleSegments",
      changeHandlerName: "onVisibleSegmentsChange",
    });
    const allSegmentIds = originalSeries.flatMap((s) => s.data.map((d) => getOptionsId(d)));
    const onVisibleSegmentsChange: CoreChartProps["onVisibleItemsChange"] = (items) => {
      const visibleSegments = items.filter((i) => i.visible).map((i) => i.id);
      fireNonCancelableEvent(props.onVisibleSegmentsChange, { visibleSegments });
    };

    // Converting donut series to Highcharts pie series.
    const series: Highcharts.SeriesOptionsType[] = originalSeries.map((s) => {
      const data = s.data as Writeable<PieChartProps.PieSegmentOptions[]>;
      const style = s.type === "pie" ? Styles.pieSeries : Styles.donutSeries;
      return { ...s, type: "pie", data, ...style };
    });

    // Pie chart imperative API.
    useImperativeHandle(ref, () => ({
      setVisibleSegments: (visibleSegmentsIds) => apiRef.current?.setItemsVisible(visibleSegmentsIds),
      showAllSegments: () => apiRef.current?.setItemsVisible(allSegmentIds),
    }));

    // Get inner area title and description for donut chart.
    const innerArea = useInnerArea(originalSeries, props);

    // We convert pie tooltip options to the core chart's getTooltipContent callback,
    // ensuring no internal types are exposed to the consumer-defined render functions.
    const getTooltipContent: CoreChartProps["getTooltipContent"] = () => {
      const transformSlotProps = (props: TooltipSlotProps): PieChartProps.TooltipDetailsRenderProps => {
        const point = props.items[0].point;
        return {
          totalValue: point.total ?? 0,
          segmentValue: point.y ?? 0,
          segmentId: getOptionsId(point.options),
          segmentName: point.name ?? "",
        };
      };
      return {
        header: tooltip?.header ? (props) => tooltip.header!(transformSlotProps(props)) : undefined,
        body:
          tooltip?.body || tooltip?.details
            ? (props) =>
                tooltip.body ? (
                  tooltip.body(transformSlotProps(props))
                ) : (
                  <ChartSeriesDetails
                    details={tooltip?.details?.(transformSlotProps(props)) ?? []}
                    compactList={true}
                  />
                )
            : undefined,
        footer: tooltip?.footer ? (props) => tooltip.footer!(transformSlotProps(props)) : undefined,
      };
    };

    // Convert pie segment props to Highcharts segment data labels.
    const segmentDataLabels:
      | Highcharts.SeriesPieDataLabelsOptionsObject
      | Highcharts.SeriesPieDataLabelsOptionsObject[] = {
      position: "left",
      formatter() {
        const { segmentTitle, segmentDescription } = props;
        const segmentProps = {
          // For pie series, we expect y, total, and name to be always present, and y to be non-null for any visible segment.
          // However, these are optional in Highcharts types, so we need to do a fallback.
          totalValue: this.total ?? 0,
          segmentValue: this.y ?? 0,
          segmentId: this.options.id,
          segmentName: this.options.name ?? "",
        };
        const title = segmentTitle ? segmentTitle(segmentProps) : this.name;
        const description = segmentDescription?.(segmentProps);
        if (title || description) {
          return renderToStaticMarkup(
            <text>
              {title ? <tspan>{title}</tspan> : null}
              <br />
              {description ? <tspan style={Styles.segmentDescriptionCss}>{description}</tspan> : null}
            </text>,
          );
        }
        return null;
      },
      useHTML: false,
    };

    const highchartsOptions: Highcharts.Options = {
      chart: {
        events: {
          render(event) {
            innerArea.onChartRender.call(this, event);
          },
        },
      },
      plotOptions: {
        pie: {
          dataLabels: segmentDataLabels,
        },
      },
      series,
    };

    return (
      <InternalCoreChart
        {...props}
        callback={(api) => (apiRef.current = api)}
        options={highchartsOptions}
        tooltip={tooltip}
        getTooltipContent={getTooltipContent}
        visibleItems={props.visibleSegments}
        onVisibleItemsChange={onVisibleSegmentsChange}
        className={testClasses.root}
      />
    );
  },
);
