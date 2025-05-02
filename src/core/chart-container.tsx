// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";

import { useContainerQuery } from "@cloudscape-design/component-toolkit";

import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

// Chart container implements the layout for top-level components, including chart plot, legend, and more.
// It also implements the height- and width overflow behaviors.

interface ChartContainerProps {
  // The header, footer, title, and legend are rendered as is, and we measure the height of these components to compute
  // the available height for the chart plot when fitHeight=true. When there is not enough vertical space, the container
  // will ensure the overflow behavior.
  chart: (height: null | number) => React.ReactNode;
  verticalAxisTitle?: React.ReactNode;
  header?: React.ReactNode;
  seriesFilter?: React.ReactNode;
  additionalFilters?: React.ReactNode;
  legend?: React.ReactNode;
  footer?: React.ReactNode;
  fitHeight?: boolean;
  chartMinHeight?: number;
  chartMinWidth?: number;
}

export function ChartContainer({
  chart,
  verticalAxisTitle,
  header,
  seriesFilter,
  additionalFilters,
  footer,
  legend,
  fitHeight,
  chartMinHeight,
  chartMinWidth,
}: ChartContainerProps) {
  const hasHeader = header || seriesFilter || additionalFilters || verticalAxisTitle;
  const hasFooter = footer || legend;

  const [measuredChartHeight, chartMeasureRef] = useContainerQuery((entry) => entry.contentBoxHeight);
  const [measuredHeaderHeight, headerMeasureRef] = useContainerQuery((entry) => entry.contentBoxHeight);
  const [measuredFooterHeight, footerMeasureRef] = useContainerQuery((entry) => entry.contentBoxHeight);

  const effectiveHeaderHeight = hasHeader ? measuredHeaderHeight : 0;
  const effectiveFooterHeight = hasFooter ? measuredFooterHeight : 0;
  const measureReady = measuredChartHeight !== null && effectiveHeaderHeight !== null && effectiveFooterHeight !== null;
  const chartHeight = !measureReady
    ? (chartMinHeight ?? null)
    : Math.max(chartMinHeight ?? 0, measuredChartHeight - effectiveHeaderHeight - effectiveFooterHeight);
  const overflowX = chartMinWidth !== undefined ? "auto" : undefined;

  const filter =
    seriesFilter || additionalFilters ? (
      <ChartFilters seriesFilter={seriesFilter} additionalFilters={additionalFilters} />
    ) : null;

  return (
    <div ref={chartMeasureRef} style={fitHeight ? { position: "absolute", inset: 0, overflowX } : { overflowX }}>
      <div ref={headerMeasureRef}>
        {header}
        {filter}
        {verticalAxisTitle}
      </div>

      <div style={chartMinWidth !== undefined ? { minWidth: chartMinWidth } : {}}>{chart(chartHeight)}</div>

      <div ref={footerMeasureRef}>
        {legend && <div>{legend}</div>}
        {footer && <div className={testClasses["chart-footer"]}>{footer}</div>}
      </div>
    </div>
  );
}

function ChartFilters({
  seriesFilter,
  additionalFilters,
}: {
  seriesFilter?: React.ReactNode;
  additionalFilters?: React.ReactNode;
}) {
  return (
    <div className={clsx(testClasses["chart-filters"], styles["chart-filters"])}>
      <div className={clsx(testClasses["chart-filters-series"], styles["chart-filters-series"])}>{seriesFilter}</div>
      <div className={testClasses["chart-filters-additional"]}>{additionalFilters}</div>
    </div>
  );
}
