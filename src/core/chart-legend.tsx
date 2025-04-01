// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";

import Box from "@cloudscape-design/components/box";

import ChartLegendComponent, { ChartLegendAction } from "../internal/components/chart-legend";
import { ChartSeriesMarkerStatus, ChartSeriesMarkerType } from "../internal/components/series-marker";
import AsyncStore, { useSelector } from "../internal/utils/async-store";
import { CloudscapeChartAPI, CoreLegendProps } from "./interfaces-core";
import { getPointId, getSeriesId, getSeriesMarkerType } from "./utils";

interface LegendItemProps {
  id: string;
  name: string;
  color: string;
  markerType: ChartSeriesMarkerType;
  active: boolean;
}

export function useLegend(
  getChart: () => CloudscapeChartAPI,
  legendProps?: CoreLegendProps & {
    getItemStatus?: (itemId: string) => ChartSeriesMarkerStatus;
    onLegendItemToggle?: (seriesOrItemId: string, visible: boolean) => void;
    onLegendItemShowOnly?: (seriesId: string) => void;
    onLegendItemShowAll?: () => void;
  },
) {
  const legendStore = useRef(new LegendStore(getChart)).current;
  legendStore.onLegendItemToggle = legendProps?.onLegendItemToggle;
  legendStore.onLegendItemShowOnly = legendProps?.onLegendItemShowOnly;
  legendStore.onLegendItemShowAll = legendProps?.onLegendItemShowAll;

  const onChartRender = legendStore.onChartRender;
  const onItemToggleHide = legendStore.onItemToggleHide;
  const onItemToggleOnly = legendStore.onItemToggleOnly;
  const onItemHighlightEnter = legendStore.onItemHighlightEnter;
  const onItemHighlightExit = legendStore.onItemHighlightExit;

  return {
    options: { onChartRender },
    props: {
      legendStore,
      ...legendProps,
      onItemToggleHide,
      onItemToggleOnly,
      onItemHighlightEnter,
      onItemHighlightExit,
    },
  };
}

export function ChartLegend({
  legendStore,
  getItemStatus,
  align,
  title,
  extendedActions,
  tooltip,
  onItemToggleHide,
  onItemToggleOnly,
  onItemHighlightEnter,
  onItemHighlightExit,
}: CoreLegendProps & {
  legendStore: LegendStore;
  onItemToggleHide: (itemId: string) => void;
  onItemToggleOnly: (itemId: string) => void;
  onItemHighlightEnter: (itemId: string) => void;
  onItemHighlightExit: () => void;
}) {
  const legendItems = useSelector(legendStore, (state) => state.legendItems);
  return (
    <Box padding={{ horizontal: "m", bottom: "xs" }}>
      <ChartLegendComponent
        legendTitle={title}
        items={legendItems.map((item) => {
          let actions: undefined | ChartLegendAction[] = undefined;
          if (extendedActions && tooltip) {
            actions = [
              { type: "show-hide", textShow: "Show item", textHide: "Hide item" },
              { type: "only-all", textOnly: "Hide other items", textAll: "Show all items" },
              { type: "detail", text: "Show item details", render: () => tooltip.render(item.id) },
            ];
          } else if (extendedActions) {
            actions = [
              { type: "show-hide", textShow: "Show item", textHide: "Hide item" },
              { type: "only-all", textOnly: "Hide other items", textAll: "Show all items" },
            ];
          } else if (tooltip) {
            actions = [
              { type: "show-hide", textShow: "Show item", textHide: "Hide item" },
              { type: "detail", text: "Show item details", render: () => tooltip.render(item.id) },
            ];
          }
          return {
            id: item.id,
            name: item.name,
            color: item.color,
            active: item.active,
            type: item.markerType,
            status: getItemStatus?.(item.id),
            actions,
          };
        })}
        align={align}
        onItemToggleHide={onItemToggleHide}
        onItemToggleOnly={onItemToggleOnly}
        onItemHighlightEnter={onItemHighlightEnter}
        onItemHighlightExit={onItemHighlightExit}
      />
    </Box>
  );
}

class LegendStore extends AsyncStore<{ legendItems: LegendItemProps[] }> {
  private getChart: () => CloudscapeChartAPI;
  public onLegendItemToggle?: (seriesOrItemId: string, visible: boolean) => void;
  public onLegendItemShowOnly?: (seriesId: string) => void;
  public onLegendItemShowAll?: () => void;

  constructor(getChart: () => CloudscapeChartAPI) {
    super({ legendItems: [] });
    this.getChart = getChart;
  }

  public onChartRender = () => {
    const legendItems = this.computeLegendItems();

    if (!isEqualArrays(legendItems, this.get().legendItems, isEqualLegendItems)) {
      this.set(() => ({ legendItems }));
    }
  };

  public onItemHighlightEnter = (itemId: string) => {
    for (const s of this.getChart().hc.series) {
      if (s.type !== "pie") {
        if (getSeriesId(s) !== itemId) {
          s.setState("inactive");
        }
      }
      if (s.type === "pie") {
        for (const p of s.data) {
          if (getPointId(p) !== itemId) {
            p.setState("inactive");
          }
        }
      }
    }
    this.getChart().hc.axes.forEach((axis) => {
      (axis as any).plotLinesAndBands?.forEach((line: Highcharts.PlotLineOrBand) => {
        if (line.options.id && line.options.id !== itemId) {
          line.svgElem?.attr({ opacity: 0.4 });
        }
      });
    });
  };

  public onItemHighlightExit = () => {
    for (const s of this.getChart().hc.series) {
      s.setState("normal");
      for (const p of s.data) {
        p.setState("normal");
      }
    }
    this.getChart().hc.axes.forEach((axis) => {
      (axis as any).plotLinesAndBands?.forEach((line: Highcharts.PlotLineOrBand) => {
        if (line.options.id) {
          line.svgElem?.attr({ opacity: 1 });
        }
      });
    });
  };

  public onItemToggleHide = (itemId: string) => {
    for (const s of this.getChart().hc.series) {
      if (getSeriesId(s) === itemId) {
        this.onLegendItemToggle?.(getSeriesId(s), !s.visible);
        return;
      }
      for (const p of s.data) {
        if (getPointId(p) === itemId) {
          this.onLegendItemToggle?.(getPointId(p), !p.visible);
          return;
        }
      }
    }
    const legendItems = this.computeLegendItems();
    if (!isEqualArrays(legendItems, this.get().legendItems, isEqualLegendItems)) {
      this.set(() => ({ legendItems }));
    }
  };

  public onItemToggleOnly = (itemId: string) => {
    let otherVisible = false;

    exit: for (const s of this.getChart().hc.series) {
      if (getSeriesId(s) !== itemId && s.type !== "pie" && s.visible) {
        otherVisible = true;
        break exit;
      }
      for (const p of s.data) {
        if (getPointId(p) !== itemId && s.type === "pie" && p.visible) {
          otherVisible = true;
          break exit;
        }
      }
    }

    if (otherVisible) {
      this.onLegendItemShowOnly?.(itemId);
    } else {
      this.onLegendItemShowAll?.();
    }

    const legendItems = this.computeLegendItems();
    if (!isEqualArrays(legendItems, this.get().legendItems, isEqualLegendItems)) {
      this.set(() => ({ legendItems }));
    }
  };

  private computeLegendItems() {
    const chart = this.getChart();
    const legendItems: LegendItemProps[] = [];

    for (const s of chart.hc.series) {
      if (s.type !== "pie") {
        legendItems.push({
          id: getSeriesId(s),
          name: s.name,
          color: typeof s.color === "string" ? s.color : "black",
          markerType: getSeriesMarkerType(s),
          active: s.visible,
        });
      }

      for (const point of s.data) {
        if (s.type === "pie") {
          legendItems.push({
            id: getPointId(point),
            name: point.name,
            color: typeof point.color === "string" ? point.color : "black",
            markerType: "large-circle",
            active: point.visible,
          });
        }
      }
    }

    return legendItems;
  }
}

function isEqualArrays<T>(a: T[], b: T[], eq: (a: T, b: T) => boolean) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!eq(a[i], b[i])) {
      return false;
    }
  }
  return true;
}

function isEqualLegendItems(a: LegendItemProps, b: LegendItemProps) {
  return (
    a.id === b.id && a.name === b.name && a.color === b.color && a.markerType === b.markerType && a.active === b.active
  );
}
