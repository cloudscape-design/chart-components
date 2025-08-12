// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef, useState } from "react";

import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";

import { BaseI18nStrings, CoreChartProps } from "../../core/interfaces";
import { getChartLegendItemsFromSeriesOptions, isLegendItemsEqual } from "../../core/utils";
import { ChartLegend as ChartLegendComponent } from "../../internal/components/chart-legend";
import { ChartSeriesMarker, ChartSeriesMarkerType } from "../../internal/components/series-marker";
import { fireNonCancelableEvent } from "../../internal/events";
import { isEqualArrays } from "../../internal/utils/utils";

export interface StandaloneLegendAPI {
  highlightItems(itemIds: readonly string[]): void;
  setItemsVisible(itemIds: readonly string[]): void;
  clearHighlight(): void;
}

export function StandaloneLegend({
  series,
  title,
  actions,
  position,
  i18nStrings,
  onItemHighlight,
  onClearHighlight,
  onVisibleItemsChange,
  getLegendTooltipContent,
  callback,
}: {
  series: Highcharts.SeriesOptionsType[];
  title?: string;
  actions?: React.ReactNode;
  position?: "bottom" | "side";
  i18nStrings?: BaseI18nStrings;
  onClearHighlight?: CoreChartProps["onClearHighlight"];
  onItemHighlight?: CoreChartProps["onLegendItemHighlight"];
  onVisibleItemsChange?: CoreChartProps["onVisibleItemsChange"];
  getLegendTooltipContent?: CoreChartProps["getLegendTooltipContent"];
  callback?: (api: StandaloneLegendAPI) => void;
}) {
  const i18n = useInternalI18n("[charts]");
  const ariaLabel = i18n("i18nStrings.legendAriaLabel", i18nStrings?.legendAriaLabel);

  const markersCache = useRef(new Map<string, React.ReactNode>()).current;
  function renderMarker(type: ChartSeriesMarkerType, color: string, visible = true): React.ReactNode {
    const key = `${type}:${color}:${visible}`;
    const marker = markersCache.get(key) ?? <ChartSeriesMarker type={type} color={color} visible={visible} />;
    markersCache.set(key, marker);
    return marker;
  }

  const [items, setItems] = useState(() => {
    return getChartLegendItemsFromSeriesOptions(series).map(({ id, name, color, markerType, visible }) => {
      const marker = renderMarker(markerType, color, visible);
      return { id, name, marker, visible, highlighted: false };
    });
  });

  const internalApi = useRef({
    clearHighlight(isApiCall: boolean) {
      setItems((prevItems) => {
        const hiddenSeries = prevItems.find((i) => !i.visible) !== undefined;
        const nextItems = prevItems.map(({ ...i }) => ({ ...i, highlighted: hiddenSeries ? i.visible : false }));
        if (!isEqualArrays(prevItems, nextItems, isLegendItemsEqual)) {
          fireNonCancelableEvent(onClearHighlight, { isApiCall });
          return nextItems;
        }
        return prevItems;
      });
    },
    highlightItems(itemIds: readonly string[]) {
      setItems((prevItems) => {
        const nextItems = prevItems.map((i) => ({
          ...i,
          highlighted: itemIds.includes(i.id),
        }));
        if (!isEqualArrays(prevItems, nextItems, isLegendItemsEqual)) {
          return nextItems;
        }
        return prevItems;
      });
    },
    setItemsVisible(itemIds: readonly string[], isApiCall: boolean) {
      setItems((prevItems) => {
        const nextItems = prevItems.map((i) => {
          const visible = itemIds.includes(i.id);
          return { ...i, visible, highlighted: visible };
        });
        if (!isEqualArrays(prevItems, nextItems, isLegendItemsEqual)) {
          fireNonCancelableEvent(onVisibleItemsChange, { items: nextItems, isApiCall });
          return nextItems;
        }
        return prevItems;
      });
    },
  }).current;

  const api = useRef<StandaloneLegendAPI>({
    clearHighlight() {
      internalApi.clearHighlight(true);
    },
    highlightItems(itemIds: readonly string[]) {
      internalApi.highlightItems(itemIds);
    },
    setItemsVisible(itemIds: readonly string[]) {
      internalApi.setItemsVisible(itemIds, true);
    },
  }).current;

  useEffect(() => {
    if (callback) {
      callback(api);
    }
  }, [callback, api]);

  if (items.length === 0) {
    return null;
  }
  return (
    <ChartLegendComponent
      items={items}
      ariaLabel={ariaLabel}
      actions={actions}
      legendTitle={title}
      position={position ?? "bottom"}
      getTooltipContent={(props) => getLegendTooltipContent?.(props) ?? null}
      onItemHighlightExit={() => internalApi.clearHighlight(false)}
      onItemVisibilityChange={(itemIds) => internalApi.setItemsVisible(itemIds, false)}
      onItemHighlightEnter={(item) => {
        internalApi.highlightItems([item.id]);
        fireNonCancelableEvent(onItemHighlight, { item });
      }}
    />
  );
}
