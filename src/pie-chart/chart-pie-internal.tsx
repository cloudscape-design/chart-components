// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useImperativeHandle } from "react";
import type Highcharts from "highcharts";

import { useControllableState } from "@cloudscape-design/component-toolkit";

import { InternalCoreChart } from "../core/chart-core";
import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
import { fireNonCancelableEvent } from "../internal/events";
import { useInnerDescriptions } from "./chart-inner-descriptions";
import { useSegmentDescriptions } from "./chart-segment-descriptions";
import { useChartTooltipPie } from "./chart-tooltip-pie";
import { InternalSeriesOptions, PieChartProps } from "./interfaces-pie";
import * as Styles from "./styles";
import { getAllSegmentIds } from "./utils";

import testClasses from "./test-classes/styles.css.js";

interface InternalPieChartProps extends InternalBaseComponentProps, Omit<PieChartProps, "series"> {
  highcharts: null | object;
  series: InternalSeriesOptions[];
}

/**
 * The InternalPieChart component takes public PieChart properties, but also Highcharts options.
 * This allows using it as a Highcharts wrapper to mix Cloudscape and Highcharts features.
 */
export const InternalPieChart = forwardRef((props: InternalPieChartProps, ref: React.Ref<PieChartProps.Ref>) => {
  // Obtaining tooltip content, specific for pie charts.
  // By default, it renders the selected content name, and allows to extend and override its contents.
  const pieTooltipProps = useChartTooltipPie(props);

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
  // Unless visible segments are explicitly set, we start from all segments being visible.
  const allSegmentIds = getAllSegmentIds(props.series);
  const visibleSegments = visibleSegmentsState ?? allSegmentIds;

  // Converting donut series to Highcharts pie series.
  // We set series color to transparent to visually hide the empty pie/donut ring.
  // That does not affect how the chart looks in non-empty state.
  const series: Highcharts.SeriesOptionsRegistry["SeriesPieOptions"][] = [];
  for (const s of props.series) {
    if (s.type === "pie") {
      series.push({ ...s, size: Styles.pieSeriesSize, color: "transparent" });
    }
    if (s.type === "donut") {
      series.push({
        ...s,
        type: "pie",
        color: "transparent",
        size: Styles.donutSeriesSize,
        innerSize: Styles.donutSeriesInnerSize,
      });
    }
  }

  // Pie chart imperative API.
  useImperativeHandle(ref, () => ({
    setVisibleSegments: setVisibleSegments,
    showAllSegments: () => setVisibleSegments(allSegmentIds),
  }));

  // Render inner value and description for donut chart.
  const hasDonutSeries = props.series.some((s) => s.type === "donut");
  const innerDescriptions = useInnerDescriptions(props, hasDonutSeries);

  // Render pie/donut segment descriptions.
  const segmentDescriptions = useSegmentDescriptions(props);

  const highchartsOptions: Highcharts.Options = {
    chart: {
      events: {
        render(event) {
          innerDescriptions.onChartRender.call(this, event);
        },
      },
    },
    plotOptions: {
      pie: {
        dataLabels: segmentDescriptions.dataLabels,
      },
    },
    series,
  };

  return (
    <InternalCoreChart
      highcharts={props.highcharts}
      fallback={props.fallback}
      options={highchartsOptions}
      ariaLabel={props.ariaLabel}
      ariaDescription={props.ariaDescription}
      fitHeight={props.fitHeight}
      chartHeight={props.chartHeight}
      chartMinHeight={props.chartMinHeight}
      chartMinWidth={props.chartMinWidth}
      tooltip={props.tooltip}
      noData={props.noData}
      legend={props.legend}
      visibleItems={visibleSegments}
      onVisibleItemsChange={(legendItems) => setVisibleSegments(legendItems.filter((i) => i.visible).map((i) => i.id))}
      filter={props.filter}
      className={testClasses.root}
      __internalRootRef={props.__internalRootRef}
      {...pieTooltipProps}
      {...getDataAttributes(props)}
    />
  );
});
