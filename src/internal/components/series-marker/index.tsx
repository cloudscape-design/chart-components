// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BaseComponentProps } from "@cloudscape-design/components/internal/base-component";
import { colorTextBodyDefault, colorTextInteractiveDisabled } from "@cloudscape-design/design-tokens";

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
  highlighted?: boolean;
}

function scale(size: number, value: number) {
  return `translate(${size * ((1 - value) / 2)}, ${size * ((1 - value) / 2)}) scale(${value})`;
}

export function ChartSeriesMarker({
  type = "line",
  color,
  visible = true,
  highlighted = false,
}: ChartSeriesMarkerProps) {
  color = visible ? color : colorTextInteractiveDisabled;
  const strokeColor = highlighted ? colorTextBodyDefault : "transparent";
  const strokeColorSquare = highlighted ? colorTextBodyDefault : color;
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
        {type === "line" && <SVGLine strokeColor={strokeColor} fillColor={color} />}

        {type === "dashed" && <SVGLineDashed strokeColor={strokeColor} fillColor={color} />}

        {type === "large-square" && <SVGLargeSquare strokeColor={strokeColorSquare} fillColor={color} />}

        {type === "hollow-square" && <SVGHollowSquare strokeColor={strokeColorSquare} fillColor={color} />}

        {type === "square" && <SVGSquare strokeColor={strokeColor} fillColor={color} />}

        {type === "diamond" && <SVGDiamond strokeColor={strokeColor} fillColor={color} />}

        {type === "triangle" && <SVGTriangle strokeColor={strokeColor} fillColor={color} />}

        {type === "triangle-down" && <SVGTriangleDown strokeColor={strokeColor} fillColor={color} />}

        {type === "circle" && <SVGCircle strokeColor={strokeColor} fillColor={color} />}
      </g>
    </svg>
  );
}

function SVGLine({ strokeColor, fillColor }: { strokeColor: string; fillColor: string }) {
  return <rect x={0} y={5} height={4} width={14} strokeWidth={2} stroke={strokeColor} fill={fillColor} rx={2} />;
}

function SVGLineDashed({ strokeColor, fillColor }: { strokeColor: string; fillColor: string }) {
  return (
    <>
      <rect x={0} y={6} height={4} width={7} strokeWidth={2} stroke={strokeColor} fill={fillColor} rx={2} />
      <rect x={8} y={6} height={4} width={7} strokeWidth={2} stroke={strokeColor} fill={fillColor} rx={2} />
    </>
  );
}

function SVGLargeSquare({ strokeColor, fillColor }: { strokeColor: string; fillColor: string }) {
  const shape = { x: 0, y: 0, width: 14, height: 14, transform: scale(14, 0.8), rx: 2 };
  return <rect {...shape} strokeWidth={2} stroke={strokeColor} fill={fillColor} />;
}

function SVGHollowSquare({ strokeColor, fillColor }: { strokeColor: string; fillColor: string }) {
  const size = { x: 0, y: 0, width: 14, height: 14, transform: scale(14, 0.8), rx: 2 };
  return <rect {...size} strokeWidth={2} stroke={strokeColor} fill={fillColor} fillOpacity="0.40" />;
}

function SVGSquare({ strokeColor, fillColor }: { strokeColor: string; fillColor: string }) {
  const size = { x: 0, y: 0, width: 14, height: 14, transform: scale(14, 0.65), rx: 2 };
  return <rect {...size} strokeWidth={2} stroke={strokeColor} fill={fillColor} />;
}

function SVGDiamond({ strokeColor, fillColor }: { strokeColor: string; fillColor: string }) {
  const shape = { points: "7,0 14,7 7,14 0,7", transform: scale(14, 0.75) };
  return <polygon {...shape} strokeWidth={2} stroke={strokeColor} fill={fillColor} />;
}

function SVGTriangle({ strokeColor, fillColor }: { strokeColor: string; fillColor: string }) {
  const shape = { points: "7,0 14,14 0,14", transform: scale(14, 0.65) };
  return <polygon {...shape} strokeWidth={2} stroke={strokeColor} fill={fillColor} />;
}

function SVGTriangleDown({ strokeColor, fillColor }: { strokeColor: string; fillColor: string }) {
  const shape = { points: "7,14 0,0 14,0", transform: scale(14, 0.65) };
  return <polygon {...shape} strokeWidth={2} stroke={strokeColor} fill={fillColor} />;
}

function SVGCircle({ strokeColor, fillColor }: { strokeColor: string; fillColor: string }) {
  const shape = { cx: 7, cy: 7, r: 7, transform: scale(14, 0.65) };
  return <circle {...shape} strokeWidth={2} stroke={strokeColor} fill={fillColor} />;
}
