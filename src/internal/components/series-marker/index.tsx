// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BaseComponentProps } from "@cloudscape-design/components/internal/base-component";

export type ChartSeriesMarkerType = "line" | "dashed" | "rectangle" | "hollow-rectangle" | "circle";

export type ChartSeriesMarkerStatus = "normal" | "warning";

interface ChartSeriesMarkerProps extends BaseComponentProps {
  type: ChartSeriesMarkerType;
  status?: ChartSeriesMarkerStatus;
  color: string;
}

export function ChartSeriesMarker(props: ChartSeriesMarkerProps) {
  return (
    <svg focusable={false} width={18} height={18} viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <ChartSeriesMarkerG {...props} />
    </svg>
  );
}

export function ChartSeriesMarkerG({ type = "line", color, status }: ChartSeriesMarkerProps) {
  const size = 14;
  const halfSize = size / 2;
  return (
    <g>
      {type === "line" && (
        <line x1={2} y1={2 + halfSize} x2={2 + size} y2={2 + halfSize} stroke={color} strokeWidth={2} />
      )}

      {type === "dashed" && (
        <line
          x1={2}
          y1={2 + halfSize}
          x2={2 + size}
          y2={2 + halfSize}
          stroke={color}
          strokeWidth={2}
          strokeDasharray="4 4"
        />
      )}

      {type === "rectangle" && <rect x={2} y={2} width={size} height={size} fill={color} rx="2" ry="2" />}

      {type === "hollow-rectangle" && (
        <g>
          <rect x={2} y={2} width={size} height={size} fill={color} opacity={0.3} rx="2" ry="2" />
          <rect x={2} y={2} width={size} height={size} stroke={color} fill="none" strokeWidth={2} rx="2" ry="2" />
        </g>
      )}

      {type === "circle" && <circle cx={2 + halfSize} cy={2 + halfSize} r={halfSize} fill={color} />}

      {status === "warning" && <WarningIcon />}
    </g>
  );
}

function WarningIcon() {
  const trianglePath = "M8 1L15 14H1Z";
  const scale = 0.75;
  return (
    <g transform={`translate(3, 3) scale(${scale})`}>
      <path d={trianglePath} stroke="white" strokeWidth={3} fill="none" />
      <path d={trianglePath} fill="orange" stroke="black" strokeWidth={0.5} />
      <line x1="8" y1="5" x2="8" y2="9" stroke="black" strokeWidth={1} />
      <line x1="8" y1="10" x2="8" y2="12" stroke="black" strokeWidth={1} />
    </g>
  );
}
