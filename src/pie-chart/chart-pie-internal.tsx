// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useImperativeHandle } from "react";
import type Highcharts from "highcharts";

import { useControllableState } from "@cloudscape-design/component-toolkit";

import { CoreChart } from "../core/chart-core";
import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { fireNonCancelableEvent } from "../internal/events";
import { useInnerDescriptions } from "./chart-inner-descriptions";
import { useSegmentDescriptions } from "./chart-segment-descriptions";
import { useChartTooltipPie } from "./chart-tooltip-pie";
import { InternalPieChartOptions, PieChartProps } from "./interfaces-pie";
import * as Styles from "./styles";
import { getAllSegmentIds } from "./utils";

import testClasses from "./test-classes/styles.css.js";

interface InternalPieChartProps extends Omit<PieChartProps, "series"> {
  highcharts: null | object;
  options: InternalPieChartOptions;
}

/**
 * The InternalPieChart component takes public PieChart properties, but also Highcharts options.
 * This allows using it as a Highcharts wrapper to mix Cloudscape and Highcharts features.
 */
export const InternalPieChart = forwardRef((props: InternalPieChartProps, ref: React.Ref<PieChartProps.Ref>) => {
  const highcharts = props.highcharts as null | typeof Highcharts;

  // Obtaining tooltip content, specific for pie charts.
  // By default, it renders the selected content name, and allows to extend and override its contents.
  const tooltipProps = useChartTooltipPie(props);

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
  const allSegmentIds = getAllSegmentIds(props.options.series);
  const visibleSegments = visibleSegmentsState ?? allSegmentIds;
  const hiddenSegments = allSegmentIds.filter((id) => !visibleSegments.includes(id));

  // Converting donut series to Highcharts pie series.
  const series: Highcharts.SeriesOptionsRegistry["SeriesPieOptions"][] = [];
  for (const s of props.options.series) {
    if (s.type === "pie") {
      series.push({ ...s });
    }
    if (s.type === "donut") {
      series.push({ ...s, type: "pie", innerSize: Styles.donutSeriesInnerSize });
    }
  }

  // Pie chart imperative API.
  useImperativeHandle(ref, () => ({
    setVisibleSegments: setVisibleSegments,
  }));

  // Render inner value and description for donut chart.
  const innerDescriptions = useInnerDescriptions(props);

  // Render pie/donut segment descriptions.
  const segmentDescriptions = useSegmentDescriptions(props);

  // Merging Highcharts options defined by the component and those provided explicitly as `options`, the latter has
  // precedence, so that it is possible to override or extend all Highcharts settings from the outside.
  const highchartsOptions: Highcharts.Options = {
    ...props.options,
    chart: {
      ...props.options.chart,
      events: {
        ...props.options.chart?.events,
        render(event) {
          innerDescriptions.onChartRender.call(this, event);
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
          ...segmentDescriptions.dataLabels,
          ...props.options.plotOptions?.pie?.dataLabels,
        },
      },
    },
    series,
  };

  return (
    <CoreChart
      highcharts={highcharts}
      options={highchartsOptions}
      fitHeight={props.fitHeight}
      chartMinHeight={props.chartMinHeight}
      chartMinWidth={props.chartMinWidth}
      tooltip={tooltipProps}
      noData={props.noData}
      legend={props.legend}
      hiddenItems={hiddenSegments}
      onItemVisibilityChange={(hiddenSegments) =>
        setVisibleSegments(allSegmentIds.filter((id) => !hiddenSegments.includes(id)))
      }
      header={props.header}
      footer={props.footer}
      filter={props.filter}
      className={testClasses.root}
      {...getDataAttributes(props)}
    />
  );
});
