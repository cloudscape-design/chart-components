// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BaseComponentProps } from "@cloudscape-design/components/internal/base-component";

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

function scale(size: number, value: number) {
  return `translate(${size * ((1 - value) / 2)}, ${size * ((1 - value) / 2)}) scale(${value})`;
}

export function ChartSeriesMarker({ type = "line", color, visible = true }: ChartSeriesMarkerProps) {
  const opacity = visible ? 1 : 0.35;
  const markerProps = { color, opacity };
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
        {type === "line" && <SVGLine {...markerProps} />}

        {type === "dashed" && <SVGLineDashed {...markerProps} />}

        {type === "large-square" && <SVGLargeSquare {...markerProps} />}

        {type === "hollow-square" && <SVGHollowSquare {...markerProps} />}

        {type === "square" && <SVGSquare {...markerProps} />}

        {type === "diamond" && <SVGDiamond {...markerProps} />}

        {type === "triangle" && <SVGTriangle {...markerProps} />}

        {type === "triangle-down" && <SVGTriangleDown {...markerProps} />}

        {type === "circle" && <SVGCircle {...markerProps} />}
      </g>
    </svg>
  );
}

function SVGLine({ color, opacity }: { color: string; opacity: number }) {
  return <rect x={0} y={5} height={4} width={14} strokeWidth={0} rx={2} fill={color} opacity={opacity} />;
}

function SVGLineDashed({ color, opacity }: { color: string; opacity: number }) {
  return (
    <>
      <rect x={0} y={5} height={4} width={7} strokeWidth={0} rx={2} fill={color} opacity={opacity} />
      <rect x={8} y={5} height={4} width={7} strokeWidth={0} rx={2} fill={color} opacity={opacity} />
    </>
  );
}

function SVGLargeSquare({ color, opacity }: { color: string; opacity: number }) {
  const shape = { x: 0, y: 0, width: 14, height: 14, transform: scale(14, 0.8), rx: 2 };
  return <rect {...shape} strokeWidth={2} stroke={color} fill={color} opacity={opacity} />;
}

function SVGHollowSquare({ color, opacity }: { color: string; opacity: number }) {
  const size = { x: 0, y: 0, width: 14, height: 14, transform: scale(14, 0.8), rx: 2 };
  return <rect {...size} strokeWidth={2} stroke={color} fill={color} opacity={opacity} fillOpacity="0.40" />;
}

function SVGSquare({ color, opacity }: { color: string; opacity: number }) {
  const size = { x: 0, y: 0, width: 14, height: 14, transform: scale(14, 0.65), rx: 2 };
  return <rect {...size} strokeWidth={0} fill={color} opacity={opacity} />;
}

function SVGDiamond({ color, opacity }: { color: string; opacity: number }) {
  const shape = { points: "7,0 14,7 7,14 0,7", transform: scale(14, 0.75) };
  return <polygon {...shape} strokeWidth={0} fill={color} opacity={opacity} />;
}

function SVGTriangle({ color, opacity }: { color: string; opacity: number }) {
  const shape = { points: "7,0 14,14 0,14", transform: scale(14, 0.65) };
  return <polygon {...shape} strokeWidth={0} fill={color} opacity={opacity} />;
}

function SVGTriangleDown({ color, opacity }: { color: string; opacity: number }) {
  const shape = { points: "7,14 0,0 14,0", transform: scale(14, 0.65) };
  return <polygon {...shape} strokeWidth={0} fill={color} opacity={opacity} />;
}

function SVGCircle({ color, opacity }: { color: string; opacity: number }) {
  const shape = { cx: 7, cy: 7, r: 7, transform: scale(14, 0.65) };
  return <circle {...shape} strokeWidth={0} fill={color} opacity={opacity} />;
}
