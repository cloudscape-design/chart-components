// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";

import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { useStableCallback } from "@cloudscape-design/component-toolkit/internal";

interface ChartContainerBaseProps {
  chart: (height: null | number) => React.ReactNode;
  title?: React.ReactNode;
  header?: React.ReactNode;
  defaultFilter?: React.ReactNode;
  additionalFilters?: React.ReactNode;
  footer?: React.ReactNode;
  legend: React.ReactNode;
  fitHeight?: boolean;
  chartMinHeight?: number;
  chartMinWidth?: number;
}

export function ChartContainer({
  chart,
  title,
  header,
  footer,
  legend,
  fitHeight,
  chartMinHeight,
  chartMinWidth,
}: ChartContainerBaseProps) {
  const [measuredChartHeight, measureRef] = useContainerQuery((entry) => entry.contentBoxHeight);
  const [measuredHeaderHeight, setHeaderHeight] = useState<null | number>(null);
  const effectiveHeaderHeight = header || title ? measuredHeaderHeight : 0;
  const [measuredFooterHeight, setFooterHeight] = useState<null | number>(null);
  const effectiveFooterHeight = legend || footer ? measuredFooterHeight : 0;
  const chartHeight =
    measuredChartHeight === null || effectiveHeaderHeight === null || effectiveFooterHeight === null
      ? (chartMinHeight ?? null)
      : Math.max(chartMinHeight ?? 0, measuredChartHeight - effectiveHeaderHeight - effectiveFooterHeight);
  const overflowX = chartMinWidth !== undefined ? "auto" : undefined;

  return (
    <div ref={measureRef} style={fitHeight ? { position: "absolute", inset: 0, overflowX } : { overflowX }}>
      <MeasureBox onResize={setHeaderHeight}>
        {header && <div>{header}</div>}
        {title && <div>{title}</div>}
      </MeasureBox>

      <div style={chartMinWidth !== undefined ? { minWidth: chartMinWidth } : {}}>{chart(chartHeight)}</div>

      <MeasureBox onResize={setFooterHeight}>
        {legend && <div>{legend}</div>}
        {footer && <div>{footer}</div>}
      </MeasureBox>
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
