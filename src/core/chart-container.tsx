// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";

import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { useStableCallback } from "@cloudscape-design/component-toolkit/internal";
import Box from "@cloudscape-design/components/box";

export function ChartContainer({
  chart,
  filter,
  legend,
  fitHeight,
  chartMinHeight,
  chartMinWidth,
}: {
  chart: (height: null | number) => React.ReactNode;
  filter: React.ReactNode;
  legend: React.ReactNode;
  fitHeight?: boolean;
  chartMinHeight?: number;
  chartMinWidth?: number;
}) {
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
      {filter ? <Box margin={{ bottom: "m" }}>{filter}</Box> : null}
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
