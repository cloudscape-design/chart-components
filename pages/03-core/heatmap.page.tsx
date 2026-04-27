// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { Page } from "../common/templates";
import { useHighcharts } from "../common/use-highcharts";
import pseudoRandom from "../utils/pseudo-random";

const INSTANCE_COUNT = 10;
const PERIOD = 60000; // 1 minute in ms
const POINTS_PER_INSTANCE = 100;
const START_TIME = Date.now() - POINTS_PER_INSTANCE * PERIOD;

function generateHeatmapData() {
  const instances = Array.from({ length: INSTANCE_COUNT }, (_, i) => `i-${String(i).padStart(16, "0")}`);

  const series = instances.map((name, yIndex) => {
    const baseValue = 0.5 + pseudoRandom() * 2.5;
    const data: [number, number, number][] = [];
    for (let x = 0; x < POINTS_PER_INSTANCE; x++) {
      const timestamp = START_TIME + x * PERIOD;
      const value = baseValue + (pseudoRandom() - 0.5) * 0.5;
      data.push([timestamp, yIndex, value]);
    }
    return {
      name,
      type: "heatmap" as const,
      data,
      borderWidth: 0,
      borderRadius: 0,
      pointPadding: 0,
      showInLegend: false,
      colsize: PERIOD,
    };
  });

  return { series, instances };
}

const { series, instances } = generateHeatmapData();

export default function () {
  const highcharts = useHighcharts({ heatmap: true });

  return (
    <Page title="Heatmap Chart Demo" subtitle="Heatmap with generated data for 10 EC2 instances.">
      <CoreChart
        highcharts={highcharts}
        chartHeight={600}
        keyboardNavigation={true}
        verticalAxisTitlePlacement="side"
        legend={{
          position: "bottom",
          enabled: true,
          enableHorizontalScroll: true,
          horizontalAlignment: "start",
        }}
        tooltip={{
          enabled: true,
          placement: "target",
          size: "large",
          debounce: 500,
          seriesSorting: "by-value-desc",
        }}
        noData={{
          statusType: "finished",
          empty: "No data available within the time range.",
        }}
        chartMinHeight={35}
        emphasizeBaseline={false}
        options={
          {
            chart: { type: "heatmap" },
            xAxis: {
              type: "datetime",
              min: START_TIME,
              max: START_TIME + (POINTS_PER_INSTANCE - 1) * PERIOD,
              crosshair: false,
            },
            yAxis: {
              categories: instances,
              crosshair: false,
              gridLineWidth: 0,
              tickLength: 5,
            },
            colorAxis: {
              stops: [
                [0, "rgb(255,0,255)"],
                [0.25, "rgb(0,0,255)"],
                [0.5, "rgb(0,255,0)"],
                [0.75, "rgb(255,255,0)"],
                [1, "rgb(255,0,0)"],
              ],
              min: 0,
              max: 3.5,
              startOnTick: false,
              endOnTick: false,
            },
            legend: undefined,
            plotOptions: {
              series: {
                clip: false,
                states: { inactive: { enabled: false } },
                point: {
                  events: {
                    mouseOver(this: any) {
                      if (!this.graphic) {
                        return;
                      }
                      this.graphic.css({ opacity: 0.7 });
                    },
                    mouseOut(this: any) {
                      this.graphic?.css({ opacity: 1 });
                    },
                  },
                },
              },
            },
            series,
          } as any
        }
      />
    </Page>
  );
}
