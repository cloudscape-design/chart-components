// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";

import { warnOnce } from "@cloudscape-design/component-toolkit/internal";
import Box from "@cloudscape-design/components/box";
import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";

import ChartSeriesDetails, { ChartSeriesDetailItem } from "../../internal/components/series-details";
import { ChartSeriesMarker } from "../../internal/components/series-marker";
import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";
import { getDefaultFormatter } from "../default-formatters";
import { ChartTooltipOptions } from "../interfaces-base";
import {
  CoreTooltipContent,
  GetTooltipContent,
  GetTooltipContentProps,
  InternalXAxisOptions,
  InternalYAxisOptions,
  TooltipSeriesFormatted,
  TooltipSlotProps,
} from "../interfaces-core";
import {
  getDataExtremes,
  getPointColor,
  getSeriesColor,
  getSeriesId,
  getSeriesMarkerType,
  isXThreshold,
} from "../utils";

import styles from "../styles.css.js";
import testClasses from "../test-classes/styles.css.js";

export function ChartTooltip({
  getTooltipContent,
  placement = "target",
  size,
  api,
}: ChartTooltipOptions & {
  getTooltipContent?: GetTooltipContent;
  api: ChartAPI;
}) {
  const [expandedSeries, setExpandedSeries] = useState<ExpandedSeriesState>({});
  const tooltip = useSelector(api.tooltipStore, (s) => s);
  if (!tooltip.visible || tooltip.group.length === 0) {
    return null;
  }
  const overrides = getTooltipContent?.({ point: tooltip.point, group: tooltip.group });
  const getTrack = placement === "target" ? api.getTargetTrack : api.getGroupTrack;
  const orientation = tooltip.point?.series.chart.inverted ? "horizontal" : "vertical";
  const position = (() => {
    if (placement === "target" || placement === "middle") {
      return orientation === "vertical" ? "right" : "bottom";
    } else {
      return orientation === "vertical" ? "bottom" : "right";
    }
  })();
  const trackKey = `${tooltip.point ? "p" : "g"}_${tooltip.group.length}_${tooltip.group[0].x}_${tooltip.point?.y}`;

  let tooltipContent: RenderedTooltipContent = { header: null, body: null, footer: null };
  if (tooltip.point && tooltip.point.series.type === "pie") {
    tooltipContent = getTooltipContentPie({
      point: tooltip.point,
      header: overrides?.header,
      body: overrides?.body,
      footer: overrides?.footer,
    });
  } else if (tooltip.group.length > 0 && tooltip.group[0].series.type !== "pie") {
    tooltipContent = getTooltipContentCartesian({
      point: tooltip.point,
      group: tooltip.group,
      series: overrides?.series,
      header: overrides?.header,
      body: overrides?.body,
      footer: overrides?.footer,
      expandedSeries,
      setExpandedSeries,
    });
  } else {
    return null;
  }

  return (
    <InternalChartTooltip
      getTrack={getTrack}
      trackKey={trackKey}
      container={null}
      className={testClasses.tooltip}
      dismissButton={tooltip.pinned}
      onDismiss={api.onDismissTooltip}
      onMouseEnter={api.onMouseEnterTooltip}
      onMouseLeave={api.onMouseLeaveTooltip}
      title={tooltipContent.header}
      footer={
        tooltipContent.footer ? (
          <>
            <hr aria-hidden={true} />
            {tooltipContent.footer}
          </>
        ) : null
      }
      size={size}
      position={position}
      minVisibleBlockSize={200}
    >
      {tooltipContent.body}
    </InternalChartTooltip>
  );
}

type ExpandedSeriesState = Record<string, Set<string>>;

interface ExpandedSeriesStateProps {
  expandedSeries: ExpandedSeriesState;
  setExpandedSeries: (cb: (state: ExpandedSeriesState) => ExpandedSeriesState) => void;
}

interface RenderedTooltipContent {
  header: React.ReactNode;
  body: React.ReactNode;
  footer: React.ReactNode;
}

function getTooltipContentCartesian({
  point,
  group,
  series: seriesOverride,
  header: headerOverride,
  body: bodyOverride,
  footer: footerOverride,
  expandedSeries,
  setExpandedSeries,
}: GetTooltipContentProps & CoreTooltipContent & ExpandedSeriesStateProps): RenderedTooltipContent {
  const x = group[0].x;
  const chart = group[0].series.chart;

  const getSeriesMarker = (series: Highcharts.Series) => {
    return <ChartSeriesMarker type={getSeriesMarkerType(series)} color={getSeriesColor(series)} />;
  };

  const matchedItems = findTooltipSeriesItems(chart.series, group);

  const detailItems: ChartSeriesDetailItem[] = matchedItems.flatMap((item) => {
    const yAxisProps = chart.yAxis[0].userOptions as InternalYAxisOptions;
    const valueFormatter = yAxisProps
      ? getDefaultFormatter(yAxisProps, getDataExtremes(chart.xAxis[0]))
      : (value: number) => value;

    const formatted: TooltipSeriesFormatted = (() => {
      // Using consumer-defined details.
      if (seriesOverride) {
        return seriesOverride({ item });
      }

      const itemY = isXThreshold(item.point.series) ? null : (item.point.y ?? null);
      return {
        key: item.point.series.name,
        value: itemY !== null ? valueFormatter(itemY) : null,
        details: item.linkedErrorbars.length ? (
          <div>
            {item.linkedErrorbars.map((errorBarPoint, index) => (
              <div key={index} className={styles["error-range"]}>
                <span>{errorBarPoint.series.userOptions.name ? errorBarPoint.series.userOptions.name : ""}</span>
                <span>
                  {valueFormatter(errorBarPoint.options.low ?? 0)} - {valueFormatter(errorBarPoint.options.high ?? 0)}
                </span>
              </div>
            ))}
          </div>
        ) : null,
      };
    })();

    const items: ChartSeriesDetailItem[] = [];
    items.push({
      key: formatted.key,
      value: formatted.value,
      marker: getSeriesMarker(item.point.series),
      subItems: formatted.subItems,
      expandableId: formatted.expandable ? item.point.series.name : undefined,
      details: formatted.details,
      selected: item.point.x === point?.x && item.point.y === point?.y,
    });
    return items;
  });

  const xAxisProps = chart.xAxis[0].userOptions as InternalXAxisOptions;
  const titleFormatter = xAxisProps
    ? getDefaultFormatter(xAxisProps, getDataExtremes(chart.xAxis[0]))
    : (value: number) => value;

  const slotRenderProps: TooltipSlotProps = {
    x: x,
    items: matchedItems,
  };

  return {
    header: headerOverride?.(slotRenderProps) ?? titleFormatter(x),
    body: bodyOverride?.(slotRenderProps) ?? (
      <ChartSeriesDetails
        details={detailItems}
        expandedSeries={expandedSeries[x]}
        setExpandedState={(id, isExpanded) => {
          setExpandedSeries((oldState) => {
            const expandedSeriesInCurrentCoordinate = new Set(oldState[x]);
            if (isExpanded) {
              expandedSeriesInCurrentCoordinate.add(id);
            } else {
              expandedSeriesInCurrentCoordinate.delete(id);
            }
            return { ...oldState, [x]: expandedSeriesInCurrentCoordinate };
          });
        }}
      />
    ),
    footer: footerOverride?.(slotRenderProps),
  };
}

function getTooltipContentPie({
  point,
  header: headerOverride,
  body: bodyOverride,
  footer: footerOverride,
}: { point: Highcharts.Point } & CoreTooltipContent): RenderedTooltipContent {
  const tooltipDetails: TooltipSlotProps = { x: point.x, items: [{ point, linkedErrorbars: [] }] };

  return {
    header: headerOverride?.(tooltipDetails) ?? (
      <div className={styles["tooltip-default-header"]}>
        <ChartSeriesMarker color={getPointColor(point)} type={getSeriesMarkerType(point.series)} />{" "}
        <Box variant="span" fontWeight="bold">
          {point.name}
        </Box>
      </div>
    ),
    body: bodyOverride?.(tooltipDetails) ?? (
      <ChartSeriesDetails details={[{ key: point.series.name, value: point.y ?? 0 }]} />
    ),
    footer: footerOverride?.(tooltipDetails),
  };
}

interface MatchedItem {
  point: Highcharts.Point;
  linkedErrorbars: Highcharts.Point[];
}

function findTooltipSeriesItems(series: Highcharts.Series[], group: Highcharts.Point[]): MatchedItem[] {
  const seriesOrder = series.reduce((d, s, i) => d.set(s, i), new Map<Highcharts.Series, number>());
  const getSeriesIndex = (s: Highcharts.Series) => {
    return seriesOrder.get(s) ?? -1;
  };

  const seriesErrors = new Map<string, Highcharts.Point[]>();
  const matchedSeries = new Set<Highcharts.Series>();

  const matchedItems: MatchedItem[] = [];

  for (const point of group) {
    if (point.series.type === "errorbar") {
      // Error bar point found for this point
      const linkedSeries = point.series.linkedParent;
      if (linkedSeries) {
        addError(getSeriesId(linkedSeries), point);
      } else {
        warnOnce(
          "Charts",
          'Could not find the series that a series of type "errorbar" is linked to. ' +
            "The error range will not be displayed in the tooltip out of the box. " +
            'Make sure that the "linkedTo" property points to an existing series.',
        );
      }
    } else {
      getMatchedPoints(point).forEach((point) => {
        if (point.x !== null) {
          matchedItems.push({ point, linkedErrorbars: [] });
        }
      });
    }
  }

  function addError(seriesId: string, errorPoint: Highcharts.Point) {
    if (errorPoint.options.low !== undefined && errorPoint.options.high !== undefined) {
      const errorRanges = seriesErrors.get(seriesId) ?? [];
      errorRanges.push(errorPoint);
      seriesErrors.set(seriesId, errorRanges);
    }
  }

  function getMatchedPoints(point: Highcharts.Point): Highcharts.Point[] {
    if (matchedSeries.has(point.series)) {
      return [];
    }
    matchedSeries.add(point.series);
    return isXThreshold(point.series)
      ? [point]
      : point.series.data.filter((d) => d.x === point.x).sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
  }

  return matchedItems
    .sort((i1, i2) => {
      const s1 = getSeriesIndex(i1.point.series) - getSeriesIndex(i2.point.series);
      return s1 || (i1.point.y ?? 0) - (i2.point.y ?? 0);
    })
    .map((item) => {
      const errorRanges = seriesErrors.get(getSeriesId(item.point.series)) ?? [];
      return {
        ...item,
        linkedErrorbars: errorRanges.sort((i1, i2) => getSeriesIndex(i1.series) - getSeriesIndex(i2.series)),
      };
    });
}
