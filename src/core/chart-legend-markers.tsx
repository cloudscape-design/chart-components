// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type Highcharts from "highcharts";

import Portal from "../internal/components/portal";
import { WarningIcon } from "../internal/components/series-marker";
import AsyncStore, { useSelector } from "../internal/utils/async-store";
import { useUniqueId } from "../internal/utils/unique-id";
import { LegendMarkersProps } from "./interfaces-core";

import testClasses from "./test-classes/styles.css.js";

interface LegendItemProps {
  id: string;
  container: Element;
}

// The legend markers add the capability to define warning state for Highcharts legend markers.
// The Highcharts legend API does not allow overriding the markers explicitly, so we use legend.labelFormatter
// to render a fake TSPAN and then provide custom content using React portal.

export function useLegendMarkers(getChart: () => Highcharts.Chart, legendMarkersProps?: LegendMarkersProps) {
  const markersId = useUniqueId("legend-markers");

  const legendMarkersStore = useRef(new LegendMarkersStore(getChart, markersId)).current;

  const legendLabelFormatter: Highcharts.FormatterCallbackFunction<Highcharts.Point | Highcharts.Series> = function () {
    legendMarkersStore.onRenderLabel();
    return renderToStaticMarkup(<tspan id={`${markersId}-${this.name}`}>{this.name}</tspan>);
  };

  return { options: { legendLabelFormatter }, props: { legendMarkersStore, ...legendMarkersProps } };
}

export function ChartLegendMarkers({
  getItemStatus,
  legendMarkersStore,
}: LegendMarkersProps & { legendMarkersStore: LegendMarkersStore }) {
  const legendItems = useSelector(legendMarkersStore, (state) => state.legendItems);
  return (
    <>
      {legendItems.map((item) =>
        getItemStatus?.(item.id) === "warning" ? (
          <Portal container={item.container} key={item.id}>
            <g transform="translate(8, 6)" className={testClasses["legend-item-warning"]}>
              <WarningIcon />
            </g>
          </Portal>
        ) : null,
      )}
    </>
  );
}

class LegendMarkersStore extends AsyncStore<{ legendItems: LegendItemProps[] }> {
  private getChart: () => Highcharts.Chart;
  private markersId: string;
  private timeoutId = setTimeout(() => {}, 0);

  constructor(getChart: () => Highcharts.Chart, markersId: string) {
    super({ legendItems: [] });
    this.getChart = getChart;
    this.markersId = markersId;
  }

  // This function is called for every legend item rendering, but we only need to compute the state once.
  // That is why we add a simple timeout-based debouncing - it ensures we don't cause many async state updates
  // unnecessarily.
  public onRenderLabel = () => {
    clearTimeout(this.timeoutId);

    this.timeoutId = setTimeout(() => {
      const chartLegendItems = this.getChart().legend.allItems;
      const containers: Element[] = [];
      for (const container of Array.from(document.querySelectorAll(`[id*="${this.markersId}-"]`))) {
        const parent = container.parentElement?.parentElement;
        if (parent) {
          containers.push(parent);
        }
      }
      if (chartLegendItems.length === containers.length) {
        this.set(() => ({
          legendItems: chartLegendItems.map((item, index) => ({
            id: item.options.id ?? item.name ?? index.toString(),
            container: containers[index],
          })),
        }));
      }
    }, 0);
  };
}
