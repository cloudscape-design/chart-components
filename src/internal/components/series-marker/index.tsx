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

function scale(size: number, value: number) {
  return `translate(${size * ((1 - value) / 2)}, ${size * ((1 - value) / 2)}) scale(${value})`;
}

export function ChartSeriesMarker({ type = "line", color, visible = true }: ChartSeriesMarkerProps) {
  color = visible ? color : colorTextInteractiveDisabled;
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
        {type === "line" && <SVGLine color={color} />}

        {type === "dashed" && <SVGLineDashed color={color} />}

        {type === "large-square" && <SVGLargeSquare color={color} />}

        {type === "hollow-square" && <SVGHollowSquare color={color} />}

        {type === "square" && <SVGSquare color={color} />}

        {type === "diamond" && <SVGDiamond color={color} />}

        {type === "triangle" && <SVGTriangle color={color} />}

        {type === "triangle-down" && <SVGTriangleDown color={color} />}

        {type === "circle" && <SVGCircle color={color} />}
      </g>
    </svg>
  );
}

function SVGLine({ color }: { color: string }) {
  return <rect x={0} y={5} height={4} width={14} strokeWidth={0} rx={2} fill={color} />;
}

function SVGLineDashed({ color }: { color: string }) {
  return (
    <>
      <rect x={0} y={5} height={4} width={7} strokeWidth={0} rx={2} fill={color} />
      <rect x={8} y={5} height={4} width={7} strokeWidth={0} rx={2} fill={color} />
    </>
  );
}

function SVGLargeSquare({ color }: { color: string }) {
  const shape = { x: 0, y: 0, width: 14, height: 14, transform: scale(14, 0.8), rx: 2 };
  return <rect {...shape} strokeWidth={2} stroke={color} fill={color} />;
}

function SVGHollowSquare({ color }: { color: string }) {
  const size = { x: 0, y: 0, width: 14, height: 14, transform: scale(14, 0.8), rx: 2 };
  return <rect {...size} strokeWidth={2} stroke={color} fill={color} fillOpacity="0.40" />;
}

function SVGSquare({ color }: { color: string }) {
  const size = { x: 0, y: 0, width: 14, height: 14, transform: scale(14, 0.65), rx: 2 };
  return <rect {...size} strokeWidth={0} fill={color} />;
}

function SVGDiamond({ color }: { color: string }) {
  const shape = { points: "7,0 14,7 7,14 0,7", transform: scale(14, 0.75) };
  return <polygon {...shape} strokeWidth={0} fill={color} />;
}

function SVGTriangle({ color }: { color: string }) {
  const shape = { points: "7,0 14,14 0,14", transform: scale(14, 0.65) };
  return <polygon {...shape} strokeWidth={0} fill={color} />;
}

function SVGTriangleDown({ color }: { color: string }) {
  const shape = { points: "7,14 0,0 14,0", transform: scale(14, 0.65) };
  return <polygon {...shape} strokeWidth={0} fill={color} />;
}

function SVGCircle({ color }: { color: string }) {
  const shape = { cx: 7, cy: 7, r: 7, transform: scale(14, 0.65) };
  return <circle {...shape} strokeWidth={0} fill={color} />;
}
