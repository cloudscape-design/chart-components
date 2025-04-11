// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";

import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { useStableCallback } from "@cloudscape-design/component-toolkit/internal";

interface ChartContainerBaseProps {
  chart: (height: null | number) => React.ReactNode;
  legend: React.ReactNode;
  fitHeight?: boolean;
  chartMinHeight?: number;
  chartMinWidth?: number;
}

export function ChartContainer({
  legendPlacement = "block-end",
  ...props
}: ChartContainerBaseProps & {
  legendPlacement?: "block-end" | "inline-end";
}) {
  return legendPlacement === "block-end" ? (
    <ChartContainerWithBlockLegend {...props} />
  ) : (
    <ChartContainerWithInlineLegend {...props} />
  );
}

function ChartContainerWithBlockLegend({
  chart,
  legend,
  fitHeight,
  chartMinHeight,
  chartMinWidth,
}: ChartContainerBaseProps) {
  const [measuredChartHeight, measureRef] = useContainerQuery((entry) => entry.contentBoxHeight);
  const [measuredLegendHeight, setLegendHeight] = useState<null | number>(null);
  const effectiveLegendHeight = legend ? measuredLegendHeight : 0;
  const chartHeight =
    measuredChartHeight === null || effectiveLegendHeight === null
      ? (chartMinHeight ?? null)
      : Math.max(chartMinHeight ?? 0, measuredChartHeight - effectiveLegendHeight);
  const overflowX = chartMinWidth !== undefined ? "auto" : undefined;
  return (
    <div ref={measureRef} style={fitHeight ? { position: "absolute", inset: 0, overflowX } : { overflowX }}>
      <div style={chartMinWidth !== undefined ? { minWidth: chartMinWidth } : {}}>{chart(chartHeight)}</div>
      <LegendBox onResize={setLegendHeight}>{legend}</LegendBox>
    </div>
  );
}

function ChartContainerWithInlineLegend({
  chart,
  legend,
  fitHeight,
  chartMinHeight,
  chartMinWidth,
}: ChartContainerBaseProps) {
  const [measuredChartHeight, measureRef] = useContainerQuery((entry) => entry.contentBoxHeight);
  const chartHeight =
    measuredChartHeight === null ? (chartMinHeight ?? null) : Math.max(chartMinHeight ?? 0, measuredChartHeight);
  const overflowX = chartMinWidth !== undefined ? "auto" : undefined;
  const innerWrapperStyle: React.CSSProperties = { display: "flex", gap: 16, inlineSize: "100%" };
  return (
    <div ref={measureRef} style={fitHeight ? { position: "absolute", inset: 0, overflowX } : { overflowX }}>
      <div style={chartMinWidth !== undefined ? { minWidth: chartMinWidth, ...innerWrapperStyle } : innerWrapperStyle}>
        <div style={{ flex: 1 }}>{chart(chartHeight)}</div>
        {legend ? (
          <div style={{ width: 200, minWidth: 200, height: measuredChartHeight ?? 0, overflowY: "auto" }}>{legend}</div>
        ) : null}
      </div>
    </div>
  );
}

function LegendBox({ children, onResize }: { children: React.ReactNode; onResize: (legendHeight: number) => void }) {
  const [height, measureRef] = useContainerQuery((entry) => entry.contentBoxHeight);
  const onResizeStable = useStableCallback(onResize);
  const hasLegend = !!children;
  useEffect(() => {
    if (hasLegend && height !== null) {
      onResizeStable(height);
    }
  }, [hasLegend, height, onResizeStable]);
  return <div ref={measureRef}>{children}</div>;
}
