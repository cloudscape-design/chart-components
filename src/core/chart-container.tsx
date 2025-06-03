// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useRef, useState } from "react";

import { useResizeObserver } from "@cloudscape-design/component-toolkit/internal";

import { DebouncedCall } from "../internal/utils/utils.js";

import testClasses from "./test-classes/styles.css.js";

// Chart container implements the layout for top-level components, including chart plot, legend, and more.
// It also implements the height- and width overflow behaviors.

interface ChartContainerProps {
  // The header, footer, vertical axis title, and legend are rendered as is, and we measure the height of these components
  // to compute the available height for the chart plot when fitHeight=true. When there is not enough vertical space, the
  // container will ensure the overflow behavior.
  chart: (height: number) => React.ReactNode;
  verticalAxisTitle?: React.ReactNode;
  header?: React.ReactNode;
  filter?: React.ReactNode;
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
  filter,
  footer,
  legend,
  fitHeight,
  chartMinHeight,
  chartMinWidth,
}: ChartContainerProps) {
  const { refs, measures } = useContainerQueries();
  const chartHeight = Math.max(chartMinHeight ?? 0, measures.chart - measures.header - measures.footer);
  const overflowX = chartMinWidth !== undefined ? "auto" : undefined;
  return (
    <div ref={refs.chart} style={fitHeight ? { position: "absolute", inset: 0, overflowX } : { overflowX }}>
      <div ref={refs.header}>
        {header}
        {filter}
      </div>

      <div
        style={chartMinWidth !== undefined ? { minWidth: chartMinWidth } : {}}
        className={testClasses["chart-plot-wrapper"]}
      >
        {verticalAxisTitle}
        {chart(chartHeight)}
      </div>

      <div ref={refs.footer}>
        {legend}
        {footer}
      </div>
    </div>
  );
}

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
