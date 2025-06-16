// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { colorBackgroundContainerContent, colorTextBodyDefault } from "@cloudscape-design/design-tokens";

import { SVGRendererPool } from "../../utils/renderer-utils";
import { ChartSeriesMarkerType } from "./interfaces";

export function renderMarker(
  chart: Highcharts.Chart,
  pool: SVGRendererPool,
  point: Highcharts.Point,
  selected: boolean,
  className?: string,
) {
  if (point.plotX === undefined || point.plotY === undefined) {
    return;
  }

  const rr = chart.renderer;
  const inverted = !!chart.inverted;
  const size = selected ? 4 : 3;
  const pointStyle = {
    zIndex: selected ? 6 : 5,
    "stroke-width": 2,
    stroke: selected ? colorTextBodyDefault : point.color,
    fill: selected ? point.color : colorBackgroundContainerContent,
    opacity: 1,
    style: "pointer-events: none",
    class: className,
  };
  const haloStyle = {
    zIndex: 6,
    "stroke-width": 0,
    stroke: point.color,
    fill: point.color,
    opacity: 0.4,
    style: "pointer-events: none",
  };

  const x = inverted ? chart.plotLeft + chart.plotWidth - point.plotY : chart.plotLeft + (point.plotX ?? 0);
  const y = inverted ? chart.plotTop + chart.plotHeight - point.plotX : chart.plotTop + (point.plotY ?? 0);

  if (selected) {
    pool.circle(rr, { ...haloStyle, x, y, r: 10 });
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
