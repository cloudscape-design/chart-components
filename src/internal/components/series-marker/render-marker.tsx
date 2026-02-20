// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { colorBackgroundContainerContent, colorTextBodyDefault } from "@cloudscape-design/design-tokens";

import { SVGRendererPool } from "../../utils/renderer-utils";
import { ChartSeriesMarkerType } from "./interfaces";

interface RenderMarkerOptions {
  chart: Highcharts.Chart;
  pool: SVGRendererPool;
  point: Highcharts.Point;
  selected: boolean;
  className?: string;
}

export function renderMarker({ chart, pool, point, selected, className }: RenderMarkerOptions) {
  if (point.plotX === undefined || point.plotY === undefined) {
    return;
  }

  const rr = chart.renderer;
  const inverted = !!chart.inverted;
  const { size, pointStyle, haloStyle } = getPointProps(point, selected, className);
  const x = inverted ? chart.plotLeft + chart.plotWidth - point.plotY : chart.plotLeft + (point.plotX ?? 0);
  const y = inverted ? chart.plotTop + chart.plotHeight - point.plotX : chart.plotTop + (point.plotY ?? 0);

  if (selected) {
    pool.circle(rr, { ...haloStyle, x, y });
  }

  const type = getSeriesMarkerType(point.series);
  switch (type) {
    case "square":
      return pool.rect(rr, { ...pointStyle, x: x - size, y: y - size, width: size * 2, height: size * 2 });

    case "diamond": {
      const path = ["M", x, y - size, "L", x + size, y, "L", x, y + size, "L", x - size, y, "Z"] as any;
      return pool.path(rr, { ...pointStyle, d: path });
    }

    case "triangle": {
      const path = ["M", x, y - size, "L", x + size, y + size, "L", x - size, y + size, "Z"] as any;
      return pool.path(rr, { ...pointStyle, d: path });
    }

    case "triangle-down": {
      const path = ["M", x, y + size, "L", x - size, y - size, "L", x + size, y - size, "Z"] as any;
      return pool.path(rr, { ...pointStyle, d: path });
    }

    case "circle":
    default:
      return pool.circle(rr, { ...pointStyle, x, y, r: size });
  }
}

function getPointProps(point: Highcharts.Point, selected: boolean, className?: string) {
  switch (point.series.type) {
    case "bubble":
      return getBubblePointProps(point, selected, className);
    default:
      return getDefaultPointProps(point, selected, className);
  }
}

function getBubblePointProps(point: Highcharts.Point, selected: boolean, className?: string) {
  const { pointStyle, haloStyle } = getDefaultPointProps(point, selected, className);
  const size = Math.max(4, (point.graphic?.getBBox().width ?? 8) / 2 - 2);
  pointStyle.fill = point.color;
  pointStyle.stroke = selected ? colorTextBodyDefault : colorBackgroundContainerContent;
  haloStyle.r = size + 4;
  return { size, pointStyle, haloStyle };
}

function getDefaultPointProps(point: Highcharts.Point, selected: boolean, className?: string) {
  const size = selected ? 4 : 3;
  const pointStyle: Highcharts.SVGAttributes = {
    zIndex: selected ? 6 : 5,
    opacity: 1,
    style: "pointer-events: none",
    class: className,
    "stroke-width": 2,
    stroke: selected ? colorTextBodyDefault : point.color,
    fill: selected ? point.color : colorBackgroundContainerContent,
  };
  const haloStyle: Highcharts.SVGAttributes = {
    zIndex: 6,
    "stroke-width": 4,
    stroke: point.color,
    fill: "transparent",
    opacity: 0.4,
    style: "pointer-events: none",
    r: 8,
  };
  return { size, pointStyle, haloStyle };
}

function getSeriesMarkerType(series: Highcharts.Series): ChartSeriesMarkerType {
  const seriesSymbol = "symbol" in series && typeof series.symbol === "string" ? series.symbol : "circle";
  if (series.type === "scatter") {
    switch (seriesSymbol) {
      case "square":
        return "square";
      case "diamond":
        return "diamond";
      case "triangle":
        return "triangle";
      case "triangle-down":
        return "triangle-down";
      case "circle":
      default:
        return "circle";
    }
  }
  return "circle";
}
