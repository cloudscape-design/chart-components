// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";

import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";

// Highcharts cropThreshold default for line series is 300.
// When series.data.length > cropThreshold AND the axis extremes are narrower than the full data range,
// Highcharts only generates Point objects for the visible viewport range.
// The series.data array is allocated to full length, but only elements from cropStart onward
// are populated — earlier indexes remain undefined.
//
// The buggy linked-series code (commit 9a1b822) accessed member.data directly with .find(),
// hitting undefined.x and crashing.
//
// To trigger the bug we need:
// 1. Linked series (linkedTo: ":previous")
// 2. More data points than cropThreshold (300 for line)
// 3. A constrained xAxis viewport (min/max) so Highcharts actually crops

const CROP_THRESHOLD = 300;
const BASE_TIME = 1600984800000;
const INTERVAL = 12000; // 12s between points

function generateData(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    x: BASE_TIME + i * INTERVAL,
    y: Math.round(50000 + Math.random() * 200000),
  }));
}

export default function () {
  const { chartProps } = useChartSettings();
  const [count, setCount] = useState(50);

  const mainData = generateData(count);
  const lastPoint = mainData[mainData.length - 1];
  const projectedData = [
    lastPoint,
    ...Array.from({ length: 10 }, (_, i) => ({
      x: lastPoint.x + (i + 1) * INTERVAL,
      y: Math.round(50000 + Math.random() * 200000),
    })),
  ];

  // Show only the last ~30% of data so Highcharts crops the beginning of the array.
  const dataEnd = projectedData[projectedData.length - 1].x;
  const dataStart = mainData[0].x;
  const viewMin = dataStart + (dataEnd - dataStart) * 0.7;

  const exceedsCrop = count > CROP_THRESHOLD;

  return (
    <Page
      title="COE: cropThreshold crash demo"
      subtitle={`Highcharts cropThreshold is ${CROP_THRESHOLD} for line series. When data exceeds this and the viewport is constrained, the data array becomes sparse. The buggy linked-series code crashes on undefined.x.`}
    >
      <SpaceBetween size="m">
        <SpaceBetween size="s" direction="horizontal">
          <Button onClick={() => setCount((c) => Math.max(10, c - 50))}>−50 points</Button>
          <Button onClick={() => setCount((c) => c + 50)}>+50 points</Button>
          <Button onClick={() => setCount((c) => c + 100)}>+100 points</Button>
          <Button onClick={() => setCount(CROP_THRESHOLD + 1)}>Set to {CROP_THRESHOLD + 1} (crash)</Button>
          <Button onClick={() => setCount(50)}>Reset</Button>
        </SpaceBetween>

        <Box variant="p">
          Current data points: <strong>{count}</strong>
          {exceedsCrop ? (
            <Box variant="span" color="text-status-error">
              {" "}
              — Exceeds cropThreshold ({CROP_THRESHOLD})! The xAxis is zoomed to the last 30% of data, so Highcharts
              will crop the array and the chart will crash.
            </Box>
          ) : (
            <Box variant="span" color="text-status-success">
              {" "}
              — Below cropThreshold ({CROP_THRESHOLD}). Chart renders fine.
            </Box>
          )}
        </Box>

        <CoreChart
          {...chartProps.core}
          ariaLabel="Linked series cropThreshold crash demo"
          options={{
            series: [
              {
                name: "Metric",
                type: "line",
                data: mainData,
              },
              {
                name: "Metric (projected)",
                linkedTo: ":previous",
                type: "line",
                dashStyle: "ShortDot",
                data: projectedData,
              },
            ],
            xAxis: {
              type: "datetime",
              title: { text: "Time (UTC)" },
              // Constrain the viewport to trigger Highcharts data cropping when data > cropThreshold.
              ...(exceedsCrop ? { min: viewMin, max: dataEnd } : {}),
            },
            yAxis: { title: { text: "Bytes transferred" } },
          }}
        />
      </SpaceBetween>
    </Page>
  );
}
