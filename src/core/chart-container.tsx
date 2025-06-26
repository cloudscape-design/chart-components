// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useRef, useState } from "react";
import clsx from "clsx";

import { useResizeObserver } from "@cloudscape-design/component-toolkit/internal";

import * as Styles from "../internal/chart-styles";
import { DebouncedCall } from "../internal/utils/utils";

import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

// Chart container implements the layout for top-level components, including chart plot, legend, and more.
// It also implements the height- and width overflow behaviors.

interface ChartContainerProps {
  // The header, footer, vertical axis title, and legend are rendered as is, and we measure the height of these components
  // to compute the available height for the chart plot when fitHeight=true. When there is not enough vertical space, the
  // container will ensure the overflow behavior.
  chart: (height: undefined | number) => React.ReactNode;
  verticalAxisTitle?: React.ReactNode;
  verticalAxisTitlePlacement: "top" | "side";
  header?: React.ReactNode;
  filter?: React.ReactNode;
  navigator?: React.ReactNode;
  legend?: React.ReactNode;
  legendBottomMaxHeight?: number;
  legendPosition: "bottom" | "side";
  footer?: React.ReactNode;
  fitHeight?: boolean;
  chartHeight?: number;
  chartMinHeight?: number;
  chartMinWidth?: number;
}

export function ChartContainer({
  chart,
  verticalAxisTitle,
  verticalAxisTitlePlacement,
  header,
  filter,
  footer,
  legend,
  legendPosition,
  legendBottomMaxHeight,
  navigator,
  fitHeight,
  chartHeight,
  chartMinHeight,
  chartMinWidth,
}: ChartContainerProps) {
  // The vertical axis title is rendered above the chart, and is technically not a part of the chart plot.
  // However, we want to include it to the chart's height computations as it does belong to the chart logically.
  // We do so by taking the title's constant height into account, when "top" axis placement is chosen.
  const verticalTitleOffset = Styles.verticalAxisTitleBlockSize + Styles.verticalAxisTitleMargin;
  const heightOffset = verticalAxisTitlePlacement === "top" ? verticalTitleOffset : 0;
  const withMinHeight = (height?: number) =>
    height === undefined ? chartMinHeight : Math.max(chartMinHeight ?? 0, height) - heightOffset;

  const { refs, measures } = useContainerQueries();
  const measuredChartHeight = withMinHeight(measures.chart - measures.header - measures.footer);
  const effectiveChartHeight = fitHeight ? measuredChartHeight : withMinHeight(chartHeight);
  return (
    <div
      ref={refs.chart}
      className={clsx({
        [styles["chart-container-fit-height"]]: fitHeight,
        [styles["chart-container-min-width"]]: chartMinWidth !== undefined,
      })}
    >
      <div ref={refs.header}>
        {header}
        {filter}
      </div>

      {legend && legendPosition === "side" ? (
        <div className={styles["chart-plot-and-legend-wrapper"]}>
          <div
            style={{ minInlineSize: chartMinWidth ?? 0 }}
            className={clsx(styles["chart-plot-wrapper"], testClasses["chart-plot-wrapper"])}
          >
            {verticalAxisTitle}
            {chart(effectiveChartHeight)}
          </div>
          <div className={styles["side-legend-container"]} style={{ maxBlockSize: effectiveChartHeight }}>
            {legend}
          </div>
        </div>
      ) : (
        <div
          style={chartMinWidth !== undefined ? { minInlineSize: chartMinWidth } : {}}
          className={testClasses["chart-plot-wrapper"]}
        >
          {verticalAxisTitle}
          {chart(effectiveChartHeight)}
        </div>
      )}

      <div ref={refs.footer} style={chartMinWidth !== undefined ? { minInlineSize: chartMinWidth } : {}}>
        {navigator && <div className={testClasses["chart-navigator"]}>{navigator}</div>}
        {legend &&
          legendPosition === "bottom" &&
          (legendBottomMaxHeight ? <div style={{ maxHeight: `${legendBottomMaxHeight}px` }}>{legend}</div> : legend)}
        {footer}
      </div>
    </div>
  );
}

// This hook combines 3 resize observer and does a small optimization to batch their updates in a single set-state.
function useContainerQueries() {
  const [measuresState, setMeasuresState] = useState({ ready: false, chart: 0, header: 0, footer: 0 });
  const measuresRef = useRef({ ready: false, chart: 0, header: 0, footer: 0 });
  const measureDebounce = useRef(new DebouncedCall()).current;
  const setMeasure = (type: "chart" | "header" | "footer", value: number) => {
    measuresRef.current[type] = value;
    measureDebounce.call(() => setMeasuresState({ ...measuresRef.current }), 0);
  };

  const chartMeasureRef = useRef<HTMLDivElement>(null);
  const getChart = useCallback(() => chartMeasureRef.current, []);
  useResizeObserver(getChart, (entry) => setMeasure("chart", entry.contentBoxHeight));

  const headerMeasureRef = useRef<HTMLDivElement>(null);
  const getHeader = useCallback(() => headerMeasureRef.current, []);
  useResizeObserver(getHeader, (entry) => setMeasure("header", entry.contentBoxHeight));

  const footerMeasureRef = useRef<HTMLDivElement>(null);
  const getFooter = useCallback(() => footerMeasureRef.current, []);
  useResizeObserver(getFooter, (entry) => setMeasure("footer", entry.contentBoxHeight));

  return {
    refs: { chart: chartMeasureRef, header: headerMeasureRef, footer: footerMeasureRef },
    measures: measuresState,
  };
}
