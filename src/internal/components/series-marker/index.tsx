// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BaseComponentProps } from "@cloudscape-design/components/internal/base-component";

export type ChartSeriesMarkerType =
  | "line"
  | "dashed"
  | "area"
  | "square"
  | "diamond"
  | "triangle"
  | "triangle-down"
  | "large-circle"
  | "circle";

export type ChartSeriesMarkerStatus = "normal" | "warning";

export interface ChartSeriesMarkerProps extends BaseComponentProps {
  type: ChartSeriesMarkerType;
  status?: ChartSeriesMarkerStatus;
  color: string;
}

export function ChartSeriesMarker({ type = "line", color, status }: ChartSeriesMarkerProps) {
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

        {type === "area" && (
          <>
            <rect x={0} y={halfSize - 2} width={size} height={6} fill={color} fillOpacity="0.75" stroke="none" />
            <line
              x1={-0.5}
              y1={halfSize - 2}
              x2={0.5 + size}
              y2={halfSize - 2}
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </>
        )}

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

        {type === "large-circle" && (
          <circle cx={halfSize} cy={halfSize} r={halfSize} fill={color} transform={scale(0.9)} />
        )}

        {type === "circle" && <circle cx={halfSize} cy={halfSize} r={halfSize} fill={color} transform={scale(0.65)} />}

        {status === "warning" && (
          <g transform={`translate(2, 0)`}>
            <WarningIcon />
          </g>
        )}
      </g>
    </svg>
  );
}

export function WarningIcon() {
  return (
    <g transform={`translate(3, 3) scale(0.75)`}>
      <path d="M8 1L15 14H1Z" stroke="white" strokeWidth={3} fill="none" />
      <path d="M8 1L15 14H1Z" fill="orange" stroke="black" strokeWidth={0.5} />
      <line x1="8" y1="5" x2="8" y2="9" stroke="black" strokeWidth={1} />
      <line x1="8" y1="10" x2="8" y2="12" stroke="black" strokeWidth={1} />
    </g>
  );
}
