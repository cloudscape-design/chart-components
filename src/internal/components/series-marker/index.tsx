// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BaseComponentProps } from "@cloudscape-design/components/internal/base-component";
import { colorTextInteractiveDisabled } from "@cloudscape-design/design-tokens";

import styles from "./styles.css.js";

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
    <div className={styles.marker}>
      <svg focusable={false} aria-hidden={true} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        {type === "line" && <SVGLine color={color} />}

        {type === "dashed" && <SVGLineDashed color={color} />}

        {type === "large-square" && <SVGLargeSquare color={color} />}

        {type === "hollow-square" && <SVGHollowSquare color={color} />}

        {type === "square" && <SVGSquare color={color} />}

        {type === "diamond" && <SVGDiamond color={color} />}

        {type === "triangle" && <SVGTriangle color={color} />}

        {type === "triangle-down" && <SVGTriangleDown color={color} />}

        {type === "circle" && <SVGCircle color={color} />}
      </svg>
    </div>
  );
}

function SVGLine({ color }: { color: string }) {
  return <rect x={1} y={7} height={4} width={14} strokeWidth={0} rx={2} fill={color} />;
}

function SVGLineDashed({ color }: { color: string }) {
  return (
    <>
      <rect x={1} y={7} height={4} width={6} strokeWidth={0} rx={2} fill={color} />
      <rect x={9} y={7} height={4} width={6} strokeWidth={0} rx={2} fill={color} />
    </>
  );
}

function SVGLargeSquare({ color }: { color: string }) {
  const shape = { x: 0, y: 0, width: 16, height: 16, rx: 2, transform: scale(16, 0.85) };
  return <rect {...shape} strokeWidth={0} fill={color} />;
}

function SVGHollowSquare({ color }: { color: string }) {
  const size = { x: 0, y: 0, width: 16, height: 16, rx: 2, transform: scale(16, 0.75) };
  return <rect {...size} strokeWidth={2} stroke={color} fill={color} fillOpacity="0.40" />;
}

function SVGSquare({ color }: { color: string }) {
  const size = { x: 3, y: 3, width: 10, height: 10, rx: 2 };
  return <rect {...size} strokeWidth={0} fill={color} />;
}

function SVGDiamond({ color }: { color: string }) {
  const shape = { points: "8,0 16,8 8,16 0,8", transform: scale(16, 0.65) };
  return <polygon {...shape} strokeWidth={0} fill={color} />;
}

function SVGTriangle({ color }: { color: string }) {
  const shape = { points: "8,0 16,16 0,16", transform: scale(16, 0.65) };
  return <polygon {...shape} strokeWidth={0} fill={color} />;
}

function SVGTriangleDown({ color }: { color: string }) {
  const shape = { points: "8,16 0,0 16,0", transform: scale(16, 0.65) };
  return <polygon {...shape} strokeWidth={0} fill={color} />;
}

function SVGCircle({ color }: { color: string }) {
  const shape = { cx: 8, cy: 8, r: 5 };
  return <circle {...shape} strokeWidth={0} fill={color} />;
}
