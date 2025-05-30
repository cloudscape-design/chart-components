// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { BaseComponentProps } from "@cloudscape-design/components/internal/base-component";
import {
  colorBackgroundLayoutMain,
  colorTextBodyDefault,
  colorTextInteractiveDisabled,
} from "@cloudscape-design/design-tokens";

import { SVGRendererPool } from "../../utils/utils";

export type ChartSeriesMarkerType =
  | "line"
  | "dashed"
  | "square"
  | "large-square"
  | "hollow-square"
  | "diamond"
  | "triangle"
  | "triangle-down"
  | "circle";

export interface ChartSeriesMarkerProps extends BaseComponentProps {
  type: ChartSeriesMarkerType;
  color: string;
  visible?: boolean;
}

export function ChartSeriesMarker({ type = "line", color, visible = true }: ChartSeriesMarkerProps) {
  color = visible ? color : colorTextInteractiveDisabled;
  const size = 14;
  const halfSize = size / 2;
  const scale = (value: number) =>
    `translate(${size * ((1 - value) / 2)}, ${size * ((1 - value) / 2)}) scale(${value})`;
  return (
    <svg
      focusable={false}
      aria-hidden={true}
      width={20}
      height={20}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(4, 4)">
        {type === "line" && <line x1={0} y1={halfSize} x2={size} y2={halfSize} stroke={color} strokeWidth={2} />}

        {type === "dashed" && (
          <line x1={0} y1={halfSize} x2={size} y2={halfSize} stroke={color} strokeWidth={2} strokeDasharray="6,2" />
        )}

        {type === "large-square" && (
          <rect x={0} y={0} width={size} height={size} fill={color} transform={scale(0.9)} rx={2} />
        )}

        {type === "hollow-square" && (
          <rect
            x={0}
            y={0}
            width={size}
            height={size}
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity="0.40"
            transform={scale(0.8)}
            rx={2}
          />
        )}

        {/* Scatter markers */}

        {type === "square" && <rect x={0} y={0} width={size} height={size} fill={color} transform={scale(0.65)} />}

        {type === "diamond" && (
          <polygon
            points={`${halfSize},${0} ${size},${halfSize} ${halfSize},${size} ${0},${halfSize}`}
            fill={color}
            transform={scale(0.75)}
          />
        )}

        {type === "triangle" && (
          <polygon points={`${halfSize},${0} ${size},${size} ${0},${size}`} fill={color} transform={scale(0.65)} />
        )}

        {type === "triangle-down" && (
          <polygon points={`${halfSize},${size} ${0},${0} ${size},${0}`} fill={color} transform={scale(0.65)} />
        )}

        {type === "circle" && <circle cx={halfSize} cy={halfSize} r={halfSize} fill={color} transform={scale(0.65)} />}
      </g>
    </svg>
  );
}

export function renderMarker(
  chart: Highcharts.Chart,
  pool: SVGRendererPool,
  point: Highcharts.Point,
  selected: boolean,
) {
  if (point.plotX === undefined || point.plotY === undefined) {
    return;
  }

  const rr = chart.renderer;
  const inverted = !!chart.inverted;
  const size = selected ? 4 : 3;
  const pointStyle = {
    zIndex: selected ? 6 : 5,
    "stroke-width": selected ? 1 : 2,
    stroke: selected ? colorTextBodyDefault : point.color,
    fill: selected ? point.color : colorBackgroundLayoutMain,
    opacity: 1,
    style: "pointer-events: none",
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
