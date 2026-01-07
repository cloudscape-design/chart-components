// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";

import { warnOnce } from "@cloudscape-design/component-toolkit/internal";
import Box from "@cloudscape-design/components/box";
import { InternalChartTooltip } from "@cloudscape-design/components/internal/do-not-use/chart-tooltip";
import LiveRegion from "@cloudscape-design/components/live-region";

import ChartSeriesDetails, { ChartSeriesDetailItem } from "../../internal/components/series-details";
import { useSelector } from "../../internal/utils/async-store";
import { getChartSeries } from "../../internal/utils/chart-series";
import { useDebouncedValue } from "../../internal/utils/use-debounced-value";
import { ChartAPI } from "../chart-api";
import { getFormatter } from "../formatters";
import { BaseI18nStrings, CoreChartProps } from "../interfaces";
import { getPointColor, getPointId, getSeriesColor, getSeriesId, getSeriesMarkerType, isXThreshold } from "../utils";

import styles from "../styles.css.js";

const MIN_VISIBLE_BLOCK_SIZE = 200;
const DEFAULT_DEBOUNCE = 200;

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

interface MatchedItem {
  point: Highcharts.Point;
  errorRanges: Highcharts.Point[];
}

export function ChartTooltip({
  placement = "target",
  size,
  getTooltipContent: getTooltipContentOverrides,
  api,
  i18nStrings,
  debounce = false,
  seriesSorting = "as-added",
}: CoreChartProps.TooltipOptions & {
  i18nStrings?: BaseI18nStrings;
  getTooltipContent?: CoreChartProps.GetTooltipContent;
  api: ChartAPI;
}) {
  const [expandedSeries, setExpandedSeries] = useState<ExpandedSeriesState>({});
  const tooltip = useSelector(api.tooltipStore, (s) => s);
  const debouncedTooltip = useDebouncedValue(tooltip, debounce === true ? DEFAULT_DEBOUNCE : debounce || 0);

  if (
    !debouncedTooltip ||
    !debouncedTooltip.visible ||
    debouncedTooltip.group.length === 0 ||
    debouncedTooltip.group[0].series === undefined
  ) {
    return null;
  }

  const chart = debouncedTooltip.group[0]?.series.chart;
  const renderers = getTooltipContentOverrides?.({ point: debouncedTooltip.point, group: debouncedTooltip.group });
  const getTrack = placement === "target" ? api.getTargetTrack : api.getGroupTrack;
  const position = (() => {
    if (placement === "target" || placement === "middle") {
      return !chart.inverted ? "right" : "bottom";
    } else {
      return !chart.inverted ? "bottom" : "right";
    }
  })();
  const content = getTooltipContent(api, {
    renderers,
    point: debouncedTooltip.point,
    group: debouncedTooltip.group,
    expandedSeries,
    setExpandedSeries,
    seriesSorting,
    hideTooltip: () => {
      api.hideTooltip();
    },
  });
  if (!content) {
    return null;
  }
  return (
    <InternalChartTooltip
      getTrack={getTrack}
      trackKey={getTrackKey(debouncedTooltip.point, debouncedTooltip.group)}
      container={null}
      dismissButton={debouncedTooltip.pinned}
      dismissAriaLabel={i18nStrings?.detailPopoverDismissAriaLabel}
      onDismiss={api.onDismissTooltip}
      onMouseEnter={api.onMouseEnterTooltip}
      onMouseLeave={api.onMouseLeaveTooltip}
      title={content.header}
      footer={
        content.footer ? (
          <>
            <hr aria-hidden={true} />
            {content.footer}
          </>
        ) : null
      }
      size={size}
      position={position}
      minVisibleBlockSize={MIN_VISIBLE_BLOCK_SIZE}
    >
      <LiveRegion>{content.body}</LiveRegion>
    </InternalChartTooltip>
  );
}

function getTrackKey(point: null | Highcharts.Point, group: readonly Highcharts.Point[]) {
  const pointId = point && (point.options.id || point.options.name);
  if (point && pointId) {
    return `p-${pointId}-${point.x}-${point.y}`;
  }
  if (point) {
    return `p-${point.x}-${point.y}`;
  }
  return `g_${group.length}_${group[0].x}`;
}

function getTooltipContent(
  api: ChartAPI,
  props: CoreChartProps.GetTooltipContentProps & {
    renderers?: CoreChartProps.TooltipContentRenderer;
    hideTooltip: () => void;
    seriesSorting: NonNullable<CoreChartProps.TooltipOptions["seriesSorting"]>;
  } & ExpandedSeriesStateProps,
): null | RenderedTooltipContent {
  if (props.point && props.point.series.type === "pie") {
    return getTooltipContentPie(api, { ...props, point: props.point });
  } else if (props.group.length > 0 && props.group[0].series.type !== "pie") {
    return getTooltipContentCartesian(api, props);
  } else {
    return null;
  }
}

function getTooltipContentCartesian(
  api: ChartAPI,
  {
    point,
    group,
    expandedSeries,
    renderers = {},
    setExpandedSeries,
    hideTooltip,
    seriesSorting,
  }: CoreChartProps.GetTooltipContentProps & {
    renderers?: CoreChartProps.TooltipContentRenderer;
    hideTooltip: () => void;
    seriesSorting: NonNullable<CoreChartProps.TooltipOptions["seriesSorting"]>;
  } & ExpandedSeriesStateProps,
): RenderedTooltipContent {
  // The cartesian tooltip might or might not have a selected point, but it always has a non-empty group.
  // By design, every point of the group has the same x value.
  const x = group[0].x;
  const chart = group[0].series.chart;
  const getSeriesMarker = (series: Highcharts.Series) => {
    const { status } = api.context.settings.getItemOptions({ itemId: getSeriesId(series) });
    return api.renderMarker({
      type: getSeriesMarkerType(series),
      color: getSeriesColor(series),
      visible: true,
      status,
      ariaLabel: api.context.settings.labels.itemMarkerLabel(status),
    });
  };
  const matchedItems = findTooltipSeriesItems(getChartSeries(chart.series), group, seriesSorting);
  const detailItems: ChartSeriesDetailItem[] = matchedItems.map((item) => {
    const valueFormatter = getFormatter(item.point.series.yAxis);
    const itemY = isXThreshold(item.point.series) ? null : (item.point.y ?? null);
    const customContent = renderers.point
      ? renderers.point({
          item,
          hideTooltip,
        })
      : undefined;
    return {
      key: customContent?.key ?? item.point.series.name,
      value: customContent?.value ?? valueFormatter(itemY),
      marker: getSeriesMarker(item.point.series),
      subItems: customContent?.subItems,
      expandableId: customContent?.expandable ? item.point.series.name : undefined,
      highlighted: item.point.x === point?.x && item.point.y === point?.y,
      description:
        customContent?.description === undefined && item.errorRanges.length ? (
          <>
            {item.errorRanges.map((errorBarPoint, index) => (
              <div key={index} className={styles["error-range"]}>
                <span>{errorBarPoint.series.userOptions.name ? errorBarPoint.series.userOptions.name : ""}</span>
                <span>
                  {valueFormatter(errorBarPoint.options.low ?? 0)} - {valueFormatter(errorBarPoint.options.high ?? 0)}
                </span>
              </div>
            ))}
          </>
        ) : (
          customContent?.description
        ),
    };
  });
  // We only support cartesian charts with a single x axis.
  const titleFormatter = getFormatter(chart.xAxis[0]);
  const slotRenderProps: CoreChartProps.TooltipSlotProps = {
    x,
    items: matchedItems,
    hideTooltip: hideTooltip,
  };
  return {
    header: renderers.header?.(slotRenderProps) ?? titleFormatter(x),
    body: renderers.body?.(slotRenderProps) ?? (
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
    footer: renderers.footer?.(slotRenderProps),
  };
}

function getTooltipContentPie(
  api: ChartAPI,
  {
    point,
    renderers = {},
    hideTooltip,
  }: { point: Highcharts.Point } & { renderers?: CoreChartProps.TooltipContentRenderer; hideTooltip: () => void },
): RenderedTooltipContent {
  const tooltipDetails: CoreChartProps.TooltipSlotProps = {
    x: point.x,
    items: [{ point, errorRanges: [] }],
    hideTooltip,
  };

  const { status } = api.context.settings.getItemOptions({ itemId: getPointId(point) });
  const markerAriaLabel = api.context.settings.labels.itemMarkerLabel(status);

  return {
    header: renderers.header?.(tooltipDetails) ?? (
      <div className={styles["tooltip-default-header"]}>
        {api.renderMarker({
          type: getSeriesMarkerType(point.series),
          color: getPointColor(point),
          visible: true,
          status,
          ariaLabel: markerAriaLabel,
        })}
        <Box variant="span" fontWeight="bold">
          {point.name}
        </Box>
      </div>
    ),
    body:
      renderers.body?.(tooltipDetails) ??
      (renderers.details ? (
        <ChartSeriesDetails
          details={renderers.details({
            point,
            hideTooltip,
          })}
          compactList={true}
        />
      ) : (
        // We expect all pie chart segments to have defined y values. We use y=0 as fallback
        // because the property is optional in Highcharts types.
        <ChartSeriesDetails details={[{ key: point.series.name, value: point.y ?? 0 }]} />
      )),
    footer: renderers.footer?.(tooltipDetails),
  };
}

function findTooltipSeriesItems(
  series: readonly Highcharts.Series[],
  group: readonly Highcharts.Point[],
  seriesSorting: NonNullable<CoreChartProps.TooltipOptions["seriesSorting"]>,
): MatchedItem[] {
  const seriesOrder = series.reduce((d, s, i) => d.set(s, i), new Map<Highcharts.Series, number>());
  const getSeriesIndex = (s: Highcharts.Series) => seriesOrder.get(s) ?? -1;
  const seriesErrors = new Map<string, Highcharts.Point[]>();
  const matchedSeries = new Set<Highcharts.Series>();
  const matchedItems: MatchedItem[] = [];
  for (const point of group) {
    // We only support errorbar series that are linked to other series. In tooltip content we add
    // linked error bars to series detail slot.
    if (point.series.type === "errorbar") {
      if (point.series.linkedParent) {
        addError(getSeriesId(point.series.linkedParent), point);
      } else {
        warnOnce(
          "chart-components",
          'The `linkedTo` property of "errorbar" series is missing, or points to a series that does not exist.',
        );
      }
    } else {
      addMatchedPoints(point);
    }
  }
  function addError(seriesId: string, errorPoint: Highcharts.Point) {
    if (errorPoint.options.low !== undefined && errorPoint.options.high !== undefined) {
      const errorRanges = seriesErrors.get(seriesId) ?? [];
      errorRanges.push(errorPoint);
      seriesErrors.set(seriesId, errorRanges);
    }
  }
  function addMatchedPoints(point: Highcharts.Point) {
    if (!matchedSeries.has(point.series)) {
      matchedSeries.add(point.series);
      if (isXThreshold(point.series)) {
        matchedItems.push({ point, errorRanges: [] });
      } else {
        point.series.data
          .filter((d) => d.x === point.x)
          .sort((a, b) => (a.y ?? 0) - (b.y ?? 0))
          .forEach((point) => matchedItems.push({ point, errorRanges: [] }));
      }
    }
  }
  return (
    matchedItems
      .sort((i1, i2) => {
        if (seriesSorting === "by-value-desc") {
          return (i2.point.y ?? 0) - (i1.point.y ?? 0);
        }
        // We sort matched items by series order. If there are multiple items that belong to the same series, we sort them by value.
        const s1 = getSeriesIndex(i1.point.series) - getSeriesIndex(i2.point.series);
        return s1 || (i1.point.y ?? 0) - (i2.point.y ?? 0);
      })
      // For each series item we add linked error ranges, sorted by their respective series indices.
      .map((item) => {
        const errorRanges = seriesErrors.get(getSeriesId(item.point.series)) ?? [];
        const sortedErrorRanges = errorRanges.sort((i1, i2) => getSeriesIndex(i1.series) - getSeriesIndex(i2.series));
        return { ...item, errorRanges: sortedErrorRanges };
      })
  );
}
