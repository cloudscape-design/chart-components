// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";

import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { useStableCallback } from "@cloudscape-design/component-toolkit/internal";

export function ChartContainer({
  chart,
  legend,
  fitHeight,
  chartMinHeight,
  chartMinWidth,
}: {
  chart: (height: null | number) => React.ReactNode;
  legend: React.ReactNode;
  fitHeight?: boolean;
  chartMinHeight?: number;
  chartMinWidth?: number;
}) {
  const [measuredHeight, measureRef] = useContainerQuery((entry) => entry.contentBoxHeight);
  const [legendHeight, setLegendHeight] = useState(0);
  const chartHeight =
    measuredHeight === null ? (chartMinHeight ?? null) : Math.max(chartMinHeight ?? 0, measuredHeight - legendHeight);
  const overflowX = chartMinWidth !== undefined ? "auto" : undefined;
  return (
    <div ref={measureRef} style={fitHeight ? { position: "absolute", inset: 0, overflowX } : { overflowX }}>
      <div style={chartMinWidth !== undefined ? { minWidth: chartMinWidth } : {}}>{chart(chartHeight)}</div>
      <LegendBox onResize={setLegendHeight}>{legend}</LegendBox>
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
