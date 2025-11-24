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
      {status === "warning" && (
        <div className={styles["marker-status"]}>
          <SVGWarning ariaLabel={i18nStrings.seriesStatusWarningAriaLabel ?? ""} />
        </div>
      )}
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
    <svg
      aria-label={ariaLabel}
      width="2048"
      height="2048"
      viewBox="0 0 2048 2048"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1026.13 189.272C1070.05 189.638 1112.23 201.32 1150.09 223.616L1151.92 224.703L1153.73 225.798C1190.95 248.557 1220.82 279.873 1241.92 317.63L1242.93 319.462L1243.02 319.61L1243.1 319.76L1842.42 1418.91C1886.25 1498.63 1883.99 1587.56 1838.52 1665.03L1838.52 1665.02C1816.34 1702.83 1785.36 1733.29 1747.79 1754.95C1709.7 1776.91 1667.35 1788.26 1623.32 1788.26H424.678C380.651 1788.26 338.304 1776.91 300.21 1754.95C262.607 1733.27 231.602 1702.77 209.421 1664.92L209.422 1664.92C163.991 1587.46 161.763 1498.54 205.625 1418.83L804.904 319.759L805.066 319.462C826.549 280.274 857.415 247.911 896.081 224.703L897.91 223.616C936.377 200.961 979.316 189.264 1024 189.264L1026.13 189.272Z"
        fill="white"
        stroke="white"
        strokeWidth="300"
      />
      <path
        d="M1123.89 1412.66V1264.33C1123.89 1257.05 1121.42 1250.93 1116.47 1245.99C1111.53 1241.04 1105.68 1238.57 1098.92 1238.57H949.085C942.322 1238.57 936.469 1241.04 931.526 1245.99C926.584 1250.93 924.113 1257.05 924.113 1264.33V1412.66C924.113 1419.94 926.584 1426.06 931.526 1431C936.469 1435.95 942.322 1438.42 949.085 1438.42H1098.92C1105.68 1438.42 1111.53 1435.95 1116.47 1431C1121.42 1426.06 1123.89 1419.94 1123.89 1412.66ZM1122.33 1120.69L1136.37 762.375C1136.37 756.13 1133.77 751.186 1128.57 747.543C1121.81 741.818 1115.56 738.956 1109.84 738.956H938.16C932.437 738.956 926.194 741.818 919.431 747.543C914.228 751.186 911.627 756.651 911.627 763.937L924.893 1120.69C924.893 1125.9 927.495 1130.19 932.697 1133.57C937.899 1136.96 944.142 1138.65 951.426 1138.65H1095.79C1103.08 1138.65 1109.19 1136.96 1114.13 1133.57C1119.07 1130.19 1121.81 1125.9 1122.33 1120.69ZM1111.4 391.567L1710.72 1490.72C1728.93 1523.51 1728.41 1556.3 1709.16 1589.08C1700.32 1604.18 1688.22 1616.15 1672.88 1624.99C1657.53 1633.84 1641.01 1638.26 1623.32 1638.26H424.678C406.99 1638.26 390.472 1633.84 375.125 1624.99C359.778 1616.15 347.682 1604.18 338.838 1589.08C319.589 1556.3 319.068 1523.51 337.277 1490.72L936.599 391.567C945.443 375.434 957.669 362.683 973.276 353.315C988.883 343.948 1005.79 339.264 1024 339.264C1042.21 339.264 1059.12 343.948 1074.72 353.315C1090.33 362.683 1102.56 375.434 1111.4 391.567Z"
        fill="#E07700"
      />
    </svg>
  );
}
