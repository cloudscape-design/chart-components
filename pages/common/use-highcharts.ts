// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";
import type Highcharts from "highcharts";

import { isDevelopment } from "@cloudscape-design/component-toolkit/internal";

export function useHighcharts({ more = false, xrange = false }: { more?: boolean; xrange?: boolean } = {}) {
  const [highcharts, setHighcharts] = useState<null | typeof Highcharts>(null);

  useEffect(() => {
    const load = async () => {
      const Highcharts = await import("highcharts");

      await import("highcharts/modules/accessibility");

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
