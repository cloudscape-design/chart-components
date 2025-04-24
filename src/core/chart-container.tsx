// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";

import { useContainerQuery } from "@cloudscape-design/component-toolkit";

import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

interface ChartContainerProps {
  chart: (height: null | number) => React.ReactNode;
  title?: React.ReactNode;
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
  title,
  header,
  seriesFilter,
  additionalFilters,
  footer,
  legend,
  fitHeight,
  chartMinHeight,
  chartMinWidth,
}: ChartContainerProps) {
  const hasHeader = header || seriesFilter || additionalFilters || title;
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
        {header && <div>{header}</div>}
        {filter && <div>{filter}</div>}
        {title && <div>{title}</div>}
      </div>

      <div style={chartMinWidth !== undefined ? { minWidth: chartMinWidth } : {}}>{chart(chartHeight)}</div>

      <div ref={footerMeasureRef}>
        {legend && <div>{legend}</div>}
        {footer && <div>{footer}</div>}
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
    <div
      className={clsx(testClasses["header-filters"], styles["header-filters"], {
        [styles["header-filters-has-series-filter"]]: !!seriesFilter,
      })}
    >
      <div className={clsx(testClasses["header-filters-series"], styles["header-filters-series"])}>{seriesFilter}</div>
      <div className={testClasses["header-filters-additional"]}>{additionalFilters}</div>
    </div>
  );
}
