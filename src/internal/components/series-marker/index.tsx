// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BaseComponentProps } from "@cloudscape-design/components/internal/base-component";
import { colorTextInteractiveDisabled } from "@cloudscape-design/design-tokens";

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
    <svg focusable={false} width={20} height={20} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(4, 4)">
        {type === "line" && <line x1={0} y1={halfSize} x2={size} y2={halfSize} stroke={color} strokeWidth={2} />}

        {type === "dashed" && (
          <line x1={0} y1={halfSize} x2={size} y2={halfSize} stroke={color} strokeWidth={2} strokeDasharray="6,2" />
        )}

        {type === "large-square" && (
          <rect x={0} y={0} width={size} height={size} fill={color} transform={scale(0.9)} rx={2} />
        )}

        {type === "square" && <rect x={0} y={0} width={size} height={size} fill={color} transform={scale(0.65)} />}

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
