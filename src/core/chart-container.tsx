// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";

import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { useStableCallback } from "@cloudscape-design/component-toolkit/internal";

interface ChartContainerBaseProps {
  chart: (height: null | number) => React.ReactNode;
  title?: React.ReactNode;
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
  title,
  legend,
  fitHeight,
  chartMinHeight,
  chartMinWidth,
}: ChartContainerBaseProps) {
  const [measuredChartHeight, measureRef] = useContainerQuery((entry) => entry.contentBoxHeight);
  const [measuredTitleHeight, setTitleHeight] = useState<null | number>(null);
  const effectiveTitleHeight = title ? measuredTitleHeight : 0;
  const [measuredLegendHeight, setLegendHeight] = useState<null | number>(null);
  const effectiveLegendHeight = legend ? measuredLegendHeight : 0;
  const chartHeight =
    measuredChartHeight === null || effectiveLegendHeight === null || effectiveTitleHeight === null
      ? (chartMinHeight ?? null)
      : Math.max(chartMinHeight ?? 0, measuredChartHeight - effectiveTitleHeight - effectiveLegendHeight);
  const overflowX = chartMinWidth !== undefined ? "auto" : undefined;
  return (
    <div ref={measureRef} style={fitHeight ? { position: "absolute", inset: 0, overflowX } : { overflowX }}>
      <MeasureBox onResize={setTitleHeight}>{title}</MeasureBox>
      <div style={chartMinWidth !== undefined ? { minWidth: chartMinWidth } : {}}>{chart(chartHeight)}</div>
      <MeasureBox onResize={setLegendHeight}>{legend}</MeasureBox>
    </div>
  );
}

function ChartContainerWithInlineLegend({
  chart,
  title,
  legend,
  fitHeight,
  chartMinHeight,
  chartMinWidth,
}: ChartContainerBaseProps) {
  const [measuredChartHeight, measureRef] = useContainerQuery((entry) => entry.contentBoxHeight);
  const [measuredTitleHeight, setTitleHeight] = useState<null | number>(null);
  const effectiveTitleHeight = title ? measuredTitleHeight : 0;
  const chartHeight =
    measuredChartHeight === null || effectiveTitleHeight === null
      ? (chartMinHeight ?? null)
      : Math.max(chartMinHeight ?? 0, measuredChartHeight - effectiveTitleHeight);
  const overflowX = chartMinWidth !== undefined ? "auto" : undefined;
  const innerWrapperStyle: React.CSSProperties = { display: "flex", gap: 16, inlineSize: "100%" };
  return (
    <div ref={measureRef} style={fitHeight ? { position: "absolute", inset: 0, overflowX } : { overflowX }}>
      <MeasureBox onResize={setTitleHeight}>{title}</MeasureBox>
      <div style={chartMinWidth !== undefined ? { minWidth: chartMinWidth, ...innerWrapperStyle } : innerWrapperStyle}>
        <div style={{ flex: 1 }}>{chart(chartHeight)}</div>
        {legend ? (
          <div style={{ width: 250, minWidth: 250, height: chartHeight ?? 0, overflowY: "auto" }}>{legend}</div>
        ) : null}
      </div>
    </div>
  );
}

function MeasureBox({ children, onResize }: { children: React.ReactNode; onResize: (contentHeight: number) => void }) {
  const [height, measureRef] = useContainerQuery((entry) => entry.contentBoxHeight);
  const onResizeStable = useStableCallback(onResize);
  const hasContent = !!children;
  useEffect(() => {
    if (hasContent && height !== null) {
      onResizeStable(height);
    }
  }, [hasContent, height, onResizeStable]);
  return <div ref={measureRef}>{children}</div>;
}
