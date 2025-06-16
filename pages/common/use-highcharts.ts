// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";
import type Highcharts from "highcharts";

import { isDevelopment } from "@cloudscape-design/component-toolkit/internal";

export function useHighcharts({ more = false, xrange = false }: { more?: boolean; xrange?: boolean } = {}) {
  const [highcharts, setHighcharts] = useState<null | typeof Highcharts>(null);

  useEffect(() => {
    const load = async () => {
      // await new Promise(resolve => setTimeout(resolve, 1000));

      const Highcharts = await import("highcharts");

      // See https://github.com/highcharts/highcharts/issues/20954#issuecomment-2618142529
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      Highcharts.seriesTypes.pie.prototype.hasData = function () {
        return this.points.some((point: any) => point.y !== null && point.visible === true);
      };

      await import("highcharts/modules/accessibility");
      await import("highcharts/modules/heatmap"); // Required for point visibility API!

      // Required for arearange, areasplinerange, columnrange, gauge, boxplot, errorbar, waterfall, polygon, bubble
      if (more) {
        await import("highcharts/highcharts-more");
      }
      if (xrange) {
        await import("highcharts/modules/xrange");
      }

      if (isDevelopment) {
        await import("highcharts/modules/debugger");
      }

      setHighcharts(Highcharts);
    };

    load();
  }, [more, xrange]);

  return highcharts;
}
