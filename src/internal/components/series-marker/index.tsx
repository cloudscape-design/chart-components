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

export type ChartSeriesMarkerStatus = "warning";

export type ChartSeriesMarkerI18n = Partial<{
  seriesStatusWarningAriaLabel: string;
}>;

export interface ChartSeriesMarkerProps extends BaseComponentProps {
  type: ChartSeriesMarkerType;
  color: string;
  visible?: boolean;
  status?: ChartSeriesMarkerStatus;
  i18nStrings: ChartSeriesMarkerI18n;
}

function scale(size: number, value: number) {
  return `translate(${size * ((1 - value) / 2)}, ${size * ((1 - value) / 2)}) scale(${value})`;
}

export function ChartSeriesMarker({
  type = "line",
  color,
  visible = true,
  status,
  i18nStrings,
}: ChartSeriesMarkerProps) {
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
      {status === "warning" && <SVGWarning ariaLabel={i18nStrings.seriesStatusWarningAriaLabel ?? ""} />}
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

function SVGWarning({ ariaLabel }: { ariaLabel: string }) {
  return (
    <svg aria-label={ariaLabel} viewBox="0 0 2048 2048" xmlns="http://www.w3.org/2000/svg" x="12" y="-1">
      <path
        fill="#E07700"
        d="M1152 1503v-190q0-14-9.5-23.5t-22.5-9.5h-192q-13 0-22.5 9.5t-9.5 23.5v190q0 14 9.5 23.5t22.5 9.5h192q13 0 22.5-9.5t9.5-23.5zm-2-374l18-459q0-12-10-19-13-11-24-11h-220q-11 0-24 11-10 7-10 21l17 457q0 10 10 16.5t24 6.5h185q14 0 23.5-6.5t10.5-16.5zm-14-934l768 1408q35 63-2 126-17 29-46.5 46t-63.5 17h-1536q-34 0-63.5-17t-46.5-46q-37-63-2-126l768-1408q17-31 47-49t65-18 65 18 47 49z"
      ></path>
    </svg>
  );
}
