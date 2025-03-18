// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";
import type Highcharts from "highcharts";

import Popover from "../internal/components/popover";
import AsyncStore, { useSelector } from "../internal/utils/async-store";
import { DebouncedCall } from "../internal/utils/utils";
import { TooltipContent } from "./interfaces-core";

import testClasses from "./test-classes/styles.css.js";

const MOUSE_LEAVE_DELAY = 300;

// The Highcharts does not support tooltip on legend. Instead, we listen to the mouse-over event on legend items,
// and then render a fake invisible target element to compute the Cloudscape chart popover position against.

export function useChartLegendTooltip(
  highcharts: null | typeof Highcharts,
  getChart: () => Highcharts.Chart,
  tooltipProps?: {
    getContent: (itemId: string) => null | TooltipContent;
  },
) {
  const legendTooltipStore = useRef(new LegendTooltipStore(getChart)).current;

  const chartRender: Highcharts.ChartRenderCallbackFunction = function () {
    if (!highcharts) {
      return;
    }
    for (const item of this.legend.allItems) {
      const itemId = item.options.id ?? item.options.name ?? "";
      const label = (item as any)?.legendItem?.label;
      label?.on("mouseover", () => legendTooltipStore.onMouseOverTarget(itemId));
      label?.on("mouseout", () => legendTooltipStore.onMouseLeaveTarget());
    }
  };

  return {
    options: { chartRender },
    props: { legendTooltipStore, getContent: tooltipProps?.getContent ?? (() => null) },
  };
}

export function ChartLegendTooltip({
  legendTooltipStore,
  getContent,
}: {
  legendTooltipStore: LegendTooltipStore;
  getContent: (itemId: string) => null | TooltipContent;
}) {
  const tooltip = useSelector(legendTooltipStore, (s) => s);
  if (!tooltip.itemId) {
    return null;
  }
  const content = getContent(tooltip.itemId);
  if (!content) {
    return null;
  }
  return (
    <Popover
      getTrack={legendTooltipStore.getTrack}
      trackKey={tooltip.itemId}
      container={null}
      dismissButton={false}
      onMouseEnter={legendTooltipStore.onMouseEnterTooltip}
      onMouseLeave={legendTooltipStore.onMouseLeaveTooltip}
      header={content.header}
      footer={content.footer}
      className={testClasses.tooltip}
    >
      {content.body}
    </Popover>
  );
}

interface ReactiveTooltipState {
  itemId: null | string;
}

class LegendTooltipStore extends AsyncStore<ReactiveTooltipState> {
  public getTrack: () => null | HTMLElement | SVGElement = () => null;

  private getChart: () => Highcharts.Chart;
  private mouseLeaveCall = new DebouncedCall();
  private tooltipHovered = false;

  constructor(getChart: () => Highcharts.Chart) {
    super({ itemId: null });
    this.getChart = getChart;
  }

  public onMouseOverTarget = (itemId: string) => {
    // If the target is hovered soon after the mouse-out was received, we cancel the mouse-out behavior to hide the tooltip.
    this.mouseLeaveCall.cancelPrevious();

    const itemIndex = this.chart.legend.allItems.findIndex((item) => (item.options.id ?? item.options.name) === itemId);
    const node = this.chart.container.querySelectorAll(`.highcharts-legend-item`)[itemIndex];

    this.getTrack = () => node as SVGElement;
    this.set(() => ({ itemId: node ? itemId : null }));
  };

  public onMouseLeaveTarget = () => {
    // The behavior is ignored if user hovers over the tooltip.
    if (this.tooltipHovered) {
      return;
    }
    this.mouseLeaveCall.cancelPrevious();
    this.mouseLeaveCall.call(() => {
      if (!this.tooltipHovered) {
        this.set(() => ({ itemId: null }));
      }
    }, MOUSE_LEAVE_DELAY);
  };

  public onMouseEnterTooltip = () => {
    this.tooltipHovered = true;
  };

  public onMouseLeaveTooltip = () => {
    this.mouseLeaveCall.cancelPrevious();
    this.mouseLeaveCall.call(() => {
      this.set(() => ({ itemId: null }));
    }, MOUSE_LEAVE_DELAY);
    this.tooltipHovered = false;
  };

  private get chart() {
    return this.getChart();
  }
}
