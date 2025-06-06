// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useImperativeHandle } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type Highcharts from "highcharts";

import { useControllableState } from "@cloudscape-design/component-toolkit";
import Box from "@cloudscape-design/components/box";

import { InternalCoreChart } from "../core/chart-core";
import { CoreChartProps, TooltipSlotProps } from "../core/interfaces";
import { getOptionsId } from "../core/utils";
import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
import { fireNonCancelableEvent } from "../internal/events";
import { useInnerDescriptions } from "./chart-inner-area";
import { InternalSeriesOptions, PieChartProps } from "./interfaces";
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
export const InternalPieChart = forwardRef(
  ({ tooltip, ...props }: InternalPieChartProps, ref: React.Ref<PieChartProps.Ref>) => {
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
            ? (props) => {
                if (tooltip.body) {
                  return tooltip.body!(transformSlotProps(props));
                }
                const details = tooltip?.details?.(transformSlotProps(props)) ?? [];
                return <TooltipDetails details={details} />;
              }
            : undefined,
        footer: tooltip?.footer ? (props) => tooltip.footer!(transformSlotProps(props)) : undefined,
      };
    };

    const segmentDataLabels:
      | Highcharts.SeriesPieDataLabelsOptionsObject
      | Highcharts.SeriesPieDataLabelsOptionsObject[] = {
      position: "left",
      formatter() {
        const { segmentTitle, segmentDescription } = props;
        const segmentProps = {
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
            innerDescriptions.onChartRender.call(this, event);
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
        highcharts={props.highcharts}
        fallback={props.fallback}
        options={highchartsOptions}
        ariaLabel={props.ariaLabel}
        ariaDescription={props.ariaDescription}
        fitHeight={props.fitHeight}
        chartHeight={props.chartHeight}
        chartMinHeight={props.chartMinHeight}
        chartMinWidth={props.chartMinWidth}
        tooltip={tooltip}
        getTooltipContent={getTooltipContent}
        noData={props.noData}
        legend={props.legend}
        visibleItems={visibleSegments}
        onVisibleItemsChange={(legendItems) =>
          setVisibleSegments(legendItems.filter((i) => i.visible).map((i) => i.id))
        }
        filter={props.filter}
        className={testClasses.root}
        __internalRootRef={props.__internalRootRef}
        {...getDataAttributes(props)}
      />
    );
  },
);

function TooltipDetails({ details }: { details: readonly PieChartProps.TooltipDetail[] }) {
  return (
    <div>
      {details.map((d, index) => (
        <div key={index} style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginLeft: "18px" }}>
          <Box variant="span">{d.key}</Box>
          <Box variant="span">{d.value}</Box>
        </div>
      ))}
    </div>
  );
}
