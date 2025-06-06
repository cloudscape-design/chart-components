// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";
import type Highcharts from "highcharts";

import { PieChartProps } from "./interfaces";
import * as Styles from "./styles";

import testClasses from "./test-classes/styles.css.js";

interface InternalPieChartProps extends Omit<PieChartProps, "series"> {
  highcharts: null | object;
}

/**
 * The InternalPieChart component takes public PieChart properties, but also Highcharts options.
 * This allows using it as a Highcharts wrapper to mix Cloudscape and Highcharts features.
 */
export function useInnerDescriptions(props: InternalPieChartProps, hasDonutSeries: boolean) {
  const innerAreaRef = useRef(new ChartInnerDescriptions());

  const onChartRender: Highcharts.ChartRenderCallbackFunction = function () {
    innerAreaRef.current.destroy();

    // The inner descriptions are only shown when at least one pie/donut segment is visible.
    const hasVisibleSeries =
      this.series.filter((s) => s.visible && s.data.some((d) => d.y !== null && d.visible)).length > 0;

    if (hasVisibleSeries && hasDonutSeries) {
      innerAreaRef.current.createDescriptions(props, this);
    }
  };

  return { onChartRender };
}

class ChartInnerDescriptions {
  private valueEl: null | Highcharts.SVGElement = null;
  private descriptionEl: null | Highcharts.SVGElement = null;

  public createDescriptions(
    { innerAreaTitle, innerAreaDescription }: { innerAreaTitle?: string; innerAreaDescription?: string },
    chart: Highcharts.Chart,
  ) {
    const textX = chart.plotLeft + chart.series[0].center[0];
    const textY = chart.plotTop + chart.series[0].center[1];

    if (innerAreaTitle) {
      this.valueEl = chart.renderer
        .text(innerAreaTitle, textX, textY)
        .attr({ zIndex: Styles.innerDescriptionZIndex, class: testClasses["inner-value"] })
        .css(Styles.donutInnerValueCss)
        .add();

      this.valueEl.attr({
        x: textX - this.valueEl.getBBox().width / 2,
        y: innerAreaDescription ? textY : textY + 10,
      });
    }
    if (innerAreaDescription) {
      this.descriptionEl = chart.renderer
        .text(innerAreaDescription, textX, textY)
        .attr({ zIndex: Styles.innerDescriptionZIndex, class: testClasses["inner-description"] })
        .css(Styles.donutInnerDescriptionCss)
        .add();

      this.descriptionEl.attr({
        x: textX - this.descriptionEl.getBBox().width / 2,
        y: textY + 20,
      });
    }
  }

  public destroy() {
    this.valueEl?.destroy();
    this.descriptionEl?.destroy();
  }
}
