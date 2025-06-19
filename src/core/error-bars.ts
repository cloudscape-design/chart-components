// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";
import type { SVGAttributes } from "highcharts";

type SVGPath = any;

export function customizeErrorBars(highcharts: typeof Highcharts) {
  highcharts.wrap(highcharts.Series.types.errorbar.prototype, "drawPoints", function () {
    const { crisp, pick } = highcharts;
    const series = this,
      points = series.points,
      options = series.options,
      chart = series.chart,
      renderer = chart.renderer,
      whiskerLength = series.options.whiskerLength;

    let q1Plot, q3Plot, highPlot, lowPlot: SVGPath | undefined, graphic: SVGElement | undefined, width;

    for (const point of points) {
      graphic = point.graphic;

      const verb = graphic ? "animate" : "attr",
        shapeArgs = point.shapeArgs,
        stemAttr: SVGAttributes = {},
        whiskersAttr: SVGAttributes = {},
        color = point.color || series.color,
        pointWhiskerLength = point.options.whiskerLength || whiskerLength;

      if (typeof point.plotY !== "undefined") {
        // Vector coordinates
        width = shapeArgs.width;
        q1Plot = point.lowPlot;
        q3Plot = point.lowPlot;
        highPlot = point.highPlot;
        lowPlot = point.lowPlot;

        if (!graphic) {
          point.graphic = graphic = renderer.g("point").add(series.group);

          point.stem = renderer.path().addClass("highcharts-boxplot-stem").add(graphic);

          if (whiskerLength) {
            point.whiskers = renderer.path().addClass("highcharts-boxplot-whisker").add(graphic);
          }
        }

        if (!chart.styledMode) {
          // Stem attributes
          stemAttr.stroke = point.stemColor || options.stemColor || color;
          stemAttr["stroke-width"] = pick(point.stemWidth, options.stemWidth, options.lineWidth);
          stemAttr.dashstyle = point.stemDashStyle || options.stemDashStyle || options.dashStyle;
          point.stem.attr(stemAttr);

          // Whiskers attributes
          if (pointWhiskerLength) {
            whiskersAttr.stroke = point.whiskerColor || options.whiskerColor || color;
            whiskersAttr["stroke-width"] = pick(point.whiskerWidth, options.whiskerWidth, options.lineWidth);
            whiskersAttr.dashstyle = point.whiskerDashStyle || options.whiskerDashStyle || options.dashStyle;
            point.whiskers.attr(whiskersAttr);
          }
        }

        // The stem
        const stemX = crisp(
          (point.plotX || 0) + (series.pointXOffset || 0) + (series.barW || 0) / 2,
          point.stem.strokeWidth(),
        );
        const d = [
          // Stem up
          ["M", stemX, q3Plot],
          ["L", stemX, highPlot],

          // Stem down
          ["M", stemX, q1Plot],
          ["L", stemX, lowPlot],
        ];
        point.stem[verb]({ d });

        // The whiskers
        if (pointWhiskerLength) {
          const halfWidth = width / 2,
            whiskers = this.getWhiskerPair(
              halfWidth,
              stemX,
              point.upperWhiskerLength ?? options.upperWhiskerLength ?? pointWhiskerLength,
              point.lowerWhiskerLength ?? options.lowerWhiskerLength ?? pointWhiskerLength,
              point,
            );

          point.whiskers[verb]({ d: whiskers });
        }
      }
    }
  });
}
