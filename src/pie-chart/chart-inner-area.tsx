// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";
import type Highcharts from "highcharts";

import * as Styles from "../internal/chart-styles";
import { PieChartProps } from "./interfaces";

import testClasses from "./test-classes/styles.css.js";

interface InnerAreaProps {
  innerAreaTitle?: string;
  innerAreaDescription?: string;
}

export function useInnerArea(series: readonly PieChartProps.SeriesOptions[], innerAreaProps: InnerAreaProps) {
  const hasDonutSeries = series.some((s) => s.type === "donut");
  const innerAreaRef = useRef(new ChartInnerDescriptions());
  const onChartRender: Highcharts.ChartRenderCallbackFunction = function () {
    innerAreaRef.current.destroy();
    if (hasDonutSeries && findVisibleSeries(this.series).length > 0) {
      innerAreaRef.current.create(innerAreaProps, this);
    }
  };
  return { onChartRender };
}

class ChartInnerDescriptions {
  private titleElement: null | Highcharts.SVGElement = null;
  private descriptionElement: null | Highcharts.SVGElement = null;

  public create({ innerAreaTitle, innerAreaDescription }: InnerAreaProps, chart: Highcharts.Chart) {
    const textX = chart.plotLeft + chart.series[0].center[0];
    const textY = chart.plotTop + chart.series[0].center[1];

    if (innerAreaTitle) {
      this.titleElement = chart.renderer
        .text(innerAreaTitle, textX, textY)
        .attr({ zIndex: 5, class: testClasses["inner-value"] })
        .css(Styles.innerAreaTitleCss)
        .add();
      this.titleElement.attr({
        x: textX - this.titleElement.getBBox().width / 2,
        y: innerAreaDescription ? textY : textY + 10,
      });
    }
    if (innerAreaDescription) {
      this.descriptionElement = chart.renderer
        .text(innerAreaDescription, textX, textY)
        .attr({ zIndex: 5, class: testClasses["inner-description"] })
        .css(Styles.innerAreaDescriptionCss)
        .add();
      this.descriptionElement.attr({
        x: textX - this.descriptionElement.getBBox().width / 2,
        y: textY + 20,
      });
    }
  }

  public destroy() {
    this.titleElement?.destroy();
    this.descriptionElement?.destroy();
  }
}

function findVisibleSeries(series: Highcharts.Series[]) {
  return series.filter((s) => s.visible && s.data.some((d) => d.y !== null && d.visible));
}
