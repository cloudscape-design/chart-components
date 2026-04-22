// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Link from "@cloudscape-design/components/link";
import SpaceBetween from "@cloudscape-design/components/space-between";

import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

const CROP_THRESHOLD = 300;
const BASE_TIME = 1600984800000;
const INTERVAL = 12000; // 12s between points

function generateData(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    x: BASE_TIME + i * INTERVAL,
    y: Math.round(50000 + pseudoRandom() * 200000),
  }));
}

export default function () {
  const { chartProps } = useChartSettings();
  const [count, setCount] = useState(50);
  const [croppedPointsCount, setCroppedPointsCount] = useState(0);

  const mainData = generateData(count);
  const lastPoint = mainData[mainData.length - 1];
  const projectedData = [
    lastPoint,
    ...Array.from({ length: 10 }, (_, i) => ({
      x: lastPoint.x + (i + 1) * INTERVAL,
      y: Math.round(50000 + pseudoRandom() * 200000),
    })),
  ];

  // Constrain the viewport to trigger Highcharts data cropping when data > cropThreshold.
  const dataEnd = projectedData[projectedData.length - 1].x;
  const dataStart = mainData[0].x;
  const viewMin = dataStart + (dataEnd - mainData[0].x) * 0.7;
  const limits = { min: viewMin, max: dataEnd };

  return (
    <Page
      title="Highcharts cropThreshold demo"
      subtitle={
        <Box variant="span">
          Highcharts cropThreshold is {CROP_THRESHOLD} for line series. When data exceeds this and the viewport is
          constrained, the data array becomes sparse. See:{" "}
          <Link external={true} href="https://api.highcharts.com/class-reference/Highcharts.Series.html#data">
            Highcharts.Series.data
          </Link>
        </Box>
      }
    >
      <SpaceBetween size="m">
        <SpaceBetween size="s" direction="horizontal">
          <Button onClick={() => setCount((c) => Math.max(1, c - 100))}>-100 points</Button>
          <Button onClick={() => setCount((c) => c + 100)}>+100 points</Button>
          <Button onClick={() => setCount(CROP_THRESHOLD + 1)}>Set to {CROP_THRESHOLD + 1} (crash)</Button>
          <Button onClick={() => setCount(50)}>Reset</Button>
        </SpaceBetween>

        <SpaceBetween size="s" direction="horizontal">
          <Box variant="p">
            Total points:{" "}
            <Box variant="span" fontWeight="bold">
              {count}
            </Box>
          </Box>
          <Box variant="p">
            Cropped points:{" "}
            <Box variant="span" fontWeight="bold" color={croppedPointsCount ? "text-status-error" : "inherit"}>
              {croppedPointsCount}
            </Box>
          </Box>
        </SpaceBetween>

        <CoreChart
          {...chartProps.core}
          ariaLabel="Linked series with default cropThreshold"
          options={{
            chart: {
              events: {
                render() {
                  let croppedPointsCount = 0;
                  for (const point of this.series[0].data ?? []) {
                    // Accessing point props (e.g. point.x) without asserting will cause an error.
                    if (!point) {
                      croppedPointsCount++;
                    }
                  }
                  setCroppedPointsCount(croppedPointsCount);
                },
              },
            },
            series: [{ name: "Metric", type: "line", data: mainData }],
            xAxis: { type: "datetime", title: { text: "Time (UTC)" }, ...limits },
            yAxis: { title: { text: "Bytes transferred" } },
          }}
        />
      </SpaceBetween>
    </Page>
  );
}
