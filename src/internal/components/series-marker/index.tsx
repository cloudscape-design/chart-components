// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useId } from "react";

import { BaseComponentProps } from "@cloudscape-design/components/internal/base-component";
import { colorBorderStatusWarning, colorTextInteractiveDisabled } from "@cloudscape-design/design-tokens";

import { ChartSeriesMarkerStatus } from "./interfaces";

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
  status: ChartSeriesMarkerStatus;
  markerAriaDescription?: string;
}

function scale(size: number, value: number) {
  return `translate(${size * ((1 - value) / 2)}, ${size * ((1 - value) / 2)}) scale(${value})`;
}

export function ChartSeriesMarker({
  type = "line",
  color,
  visible = true,
  status,
  markerAriaDescription,
}: ChartSeriesMarkerProps) {
  color = visible ? color : colorTextInteractiveDisabled;

  // As React re-renders the components, a new ID should be created for masks.
  // Not doing so will not evaluate the mask.
  const maskId = useId();

  return (
    <div className={styles.marker}>
      {markerAriaDescription && <span className={styles.visuallyHidden}>{markerAriaDescription}</span>}
      <svg focusable={false} aria-hidden={true} viewBox="0 0 24 16" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />

            {status === "warning" && <SVGWarningMask></SVGWarningMask>}
          </mask>
        </defs>

        {status === "warning" && <SVGWarning></SVGWarning>}

        {type === "line" && <SVGLine maskId={maskId} color={color} />}

        {type === "dashed" && <SVGLineDashed maskId={maskId} color={color} />}

        {type === "large-square" && <SVGLargeSquare maskId={maskId} color={color} />}

        {type === "hollow-square" && <SVGHollowSquare maskId={maskId} color={color} />}

        {type === "square" && <SVGSquare maskId={maskId} color={color} />}

        {type === "diamond" && <SVGDiamond maskId={maskId} color={color} />}

        {type === "triangle" && <SVGTriangle maskId={maskId} color={color} />}

        {type === "triangle-down" && <SVGTriangleDown maskId={maskId} color={color} />}

        {type === "circle" && <SVGCircle maskId={maskId} color={color} />}
      </svg>
    </div>
  );
}

function SVGLine({ color, maskId }: { color: string; maskId: string }) {
  return <rect mask={`url(#${maskId})`} x={1} y={7} height={4} width={14} strokeWidth={0} rx={2} fill={color} />;
}

function SVGLineDashed({ color, maskId }: { color: string; maskId: string }) {
  return (
    <>
      <rect mask={`url(#${maskId})`} x={1} y={7} height={4} width={6} strokeWidth={0} rx={2} fill={color} />
      <rect mask={`url(#${maskId})`} x={9} y={7} height={4} width={6} strokeWidth={0} rx={2} fill={color} />
    </>
  );
}

function SVGLargeSquare({ color, maskId }: { color: string; maskId: string }) {
  const shape = { x: 0, y: 0, width: 16, height: 16, rx: 2, transform: scale(16, 0.85) };
  return <rect mask={`url(#${maskId})`} {...shape} strokeWidth={0} fill={color} />;
}

function SVGHollowSquare({ color, maskId }: { color: string; maskId: string }) {
  const size = { x: 0, y: 0, width: 16, height: 16, rx: 2, transform: scale(16, 0.75) };
  return <rect mask={`url(#${maskId})`} {...size} strokeWidth={2} stroke={color} fill={color} fillOpacity="0.40" />;
}

function SVGSquare({ color, maskId }: { color: string; maskId: string }) {
  const size = { x: 3, y: 3, width: 10, height: 10, rx: 2 };
  return <rect mask={`url(#${maskId})`} {...size} strokeWidth={0} fill={color} />;
}

function SVGDiamond({ color, maskId }: { color: string; maskId: string }) {
  const shape = { points: "8,0 16,8 8,16 0,8", transform: scale(16, 0.65) };
  return <polygon mask={`url(#${maskId})`} {...shape} strokeWidth={0} fill={color} />;
}

function SVGTriangle({ color, maskId }: { color: string; maskId: string }) {
  const shape = { points: "8,0 16,16 0,16", transform: scale(16, 0.65) };
  return <polygon mask={`url(#${maskId})`} {...shape} strokeWidth={0} fill={color} />;
}

function SVGTriangleDown({ color, maskId }: { color: string; maskId: string }) {
  const shape = { points: "8,16 0,0 16,0", transform: scale(16, 0.65) };
  return <polygon mask={`url(#${maskId})`} {...shape} strokeWidth={0} fill={color} />;
}

function SVGCircle({ color, maskId }: { color: string; maskId: string }) {
  const shape = { cx: 8, cy: 8, r: 5 };
  return <circle mask={`url(#${maskId})`} {...shape} strokeWidth={0} fill={color} />;
}

const SVGWarningTranslate = `translate(10, 1)`;

function SVGWarning() {
  return (
    <path
      data-testid="warning"
      transform={`${SVGWarningTranslate} ${scale(16, 0.8)}`}
      d="M9.14157,12.3948v-1.713c0,-0.084,-0.028,-0.154,-0.085,-0.211c-0.056,-0.058,-0.123,-0.086,-0.2,-0.086h-1.713c-0.077,0,-0.144,0.028,-0.2,0.086c-0.057,0.057,-0.085,0.127,-0.085,0.211v1.713c0,0.084,0.028,0.155,0.085,0.212c0.056,0.057,0.123,0.085,0.2,0.085h1.713c0.077,0,0.144,-0.028,0.2,-0.085c0.057,-0.057,0.085,-0.128,0.085,-0.212zm-0.018,-3.371l0.161,-4.138c0,-0.072,-0.03,-0.129,-0.089,-0.171c-0.078,-0.066,-0.149,-0.099,-0.215,-0.099h-1.962c-0.065,0,-0.136,0.033,-0.214,0.099c-0.059,0.042,-0.089,0.105,-0.089,0.189l0.152,4.12c0,0.06,0.03,0.109,0.089,0.148c0.059,0.039,0.131,0.059,0.214,0.059h1.65c0.083,0,0.153,-0.02,0.21,-0.059c0.056,-0.039,0.087,-0.088,0.093,-0.148zm-0.125,-8.419l6.85,12.692c0.208,0.378,0.202,0.757,-0.018,1.136c-0.101,0.174,-0.24,0.312,-0.415,0.414c-0.175,0.102,-0.364,0.154,-0.566,0.154h-13.699c-0.202,0,-0.391,-0.052,-0.566,-0.154c-0.176,-0.102,-0.314,-0.24,-0.415,-0.414c-0.22,-0.379,-0.226,-0.758,-0.018,-1.136l6.849,-12.692c0.101,-0.187,0.241,-0.334,0.42,-0.442c0.178,-0.108,0.371,-0.162,0.579,-0.162c0.208,0,0.402,0.054,0.58,0.162c0.178,0.108,0.318,0.255,0.419,0.442z"
      fill={colorBorderStatusWarning}
    />
  );
}

function SVGWarningMask() {
  return (
    <path
      transform={`${SVGWarningTranslate} ${scale(16, 1.4)}`}
      d="M8 0C8.2081 2.01716e-08 8.40171 0.0539363 8.58008 0.162109C8.75826 0.270216 8.898 0.417425 8.99902 0.603516L15.8486 13.2959C16.0567 13.6744 16.05 14.0531 15.8301 14.4316C15.7291 14.6058 15.5913 14.7445 15.416 14.8467C15.2407 14.9488 15.0517 15 14.8496 15H1.15039C0.94832 15 0.759318 14.9488 0.583984 14.8467C0.408709 14.7445 0.270949 14.6058 0.169922 14.4316C-0.0499612 14.0531 -0.0566966 13.6744 0.151367 13.2959L7.00098 0.603516C7.102 0.417424 7.24174 0.270216 7.41992 0.162109C7.59829 0.0539363 7.7919 0 8 0Z"
      fill="black"
    />
  );
}
