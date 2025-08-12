// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef, useState } from "react";
import Highcharts from "highcharts/highstock";
import { omit } from "lodash";

import Button from "@cloudscape-design/components/button";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Link from "@cloudscape-design/components/link";

import CoreChart, { CoreChartProps } from "../../lib/components/internal-do-not-use/core-chart";
import { numberFormatter } from "../common/formatters";
import { PageSettingsForm, useChartSettings } from "../common/page-settings";
import { Page } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

function randomInt(min: number, max: number) {
  return min + Math.floor(pseudoRandom() * (max - min));
}

/**
 * Generates a specified number of datapoints for chart visualization
 * @param count Number of datapoints to generate
 * @returns Array of {x, y} pairs where x is timestamp and y is value
 */
function generateDatapoints(count: number = 8000) {
  const datapoints = [];
  const startTimestamp = 1600984800000; // Starting timestamp from original data
  const timeInterval = 900000; // 15 minutes in milliseconds

  for (let i = 0; i < count; i++) {
    // Generate timestamp with consistent intervals
    const timestamp = startTimestamp + i * timeInterval;

    // Generate y values following a similar pattern to the original data
    // Values range roughly from ~50k to ~500k with some patterns
    let value;

    if (i === Math.floor(count * 0.94)) {
      // Position null value near the end (similar to original)
      value = null;
    } else {
      // Base value with some wave pattern
      const baseValue = 150000 + 100000 * Math.sin(i / 5);

      // Add randomness
      value = Math.floor(baseValue + randomInt(-50000, 150000));

      // Ensure the value is positive
      value = Math.max(value, 50000);
    }

    datapoints.push({ x: timestamp, y: value });
  }

  return datapoints;
}

export default function () {
  const { chartProps } = useChartSettings();
  const [dataPointCount, setDataPointCount] = useState<string>("8000");

  // Initialize with default series data to avoid empty chart on first render
  const [series, setSeries] = useState<Highcharts.SeriesOptionsType[]>(() => {
    const initialBaseline = generateDatapoints(8000);
    const dataA = initialBaseline.map(({ x, y }) => ({ x, y }));
    const dataB = initialBaseline.map(({ x, y }) => ({ x, y: y === null ? null : y + randomInt(-100000, 100000) }));
    const dataC = initialBaseline.map(({ x, y }) => ({ x, y: y === null ? null : y + randomInt(-150000, 50000) }));
    const nullPointTimestamp = initialBaseline.find((point) => point.y === null)?.x || 1601012700000;

    return [
      { name: "A", type: "line", data: dataA },
      { name: "B", type: "line", data: dataB },
      { name: "C", type: "line", data: dataC },
      {
        name: "X",
        type: "scatter",
        data: [{ x: nullPointTimestamp, y: 500000 }],
        marker: { symbol: "square" },
        showInLegend: false,
      },
    ];
  });

  console.log(series);

  useEffect(() => {
    // Parse the input as a number, default to 8000 if invalid
    const count = parseInt(dataPointCount, 10);
    // Limit to reasonable range to prevent performance issues
    const validCount = isNaN(count) || count < 1 ? 8000 : Math.min(count, 10000);

    // Generate the baseline with the specified number of points
    const baseline = generateDatapoints(validCount);

    // Create the series data
    const dataA = baseline.map(({ x, y }) => ({ x, y }));
    const dataB = baseline.map(({ x, y }) => ({ x, y: y === null ? null : y + randomInt(-100000, 100000) }));
    const dataC = baseline.map(({ x, y }) => ({ x, y: y === null ? null : y + randomInt(-150000, 50000) }));

    // Find the null data point timestamp for the scatter point (or use a default)
    const nullPointTimestamp = baseline.find((point) => point.y === null)?.x || 1601012700000;

    // Update the series data
    setSeries([
      {
        name: "A",
        type: "line",
        data: dataA,
      },
      {
        name: "B",
        type: "line",
        data: dataB,
      },
      {
        name: "C",
        type: "line",
        data: dataC,
      },
      {
        name: "X",
        type: "scatter",
        data: [{ x: nullPointTimestamp, y: 500000 }],
        marker: { symbol: "square" },
        showInLegend: false,
      },
    ]);
  }, [dataPointCount]);

  // Handle datapoint count input changes
  const handleDataPointCountChange = (value: string) => {
    setDataPointCount(value);
  };

  const [isChartZoomed, setIsChartZoomed] = useState(false);

  // Define type explicitly to fix TypeScript errors
  const finalOptions: Highcharts.Options = {
    chart: {
      spacingBottom: 12,
      spacingTop: 12,
      spacingLeft: 12,
      spacingRight: 12,
      zooming: {
        type: "x",
        mouseWheel: {
          enabled: false,
        },
        resetButton: {
          theme: {
            style: {
              display: "block",
            },
          },
        },
      },
      backgroundColor: "var(--color-background-container-content-h114dj, #ffffff)",
      plotBackgroundColor: "var(--color-background-container-content-h114dj, #ffffff)",
      borderColor: "var(--color-border-divider-default-nfermc, #c6c6cd)",
      type: "line",
      marginLeft: 60,
      events: {},
    },
    credits: {
      enabled: false,
    },
    colors: [
      "var(--color-charts-palette-categorical-1-xu0deg, #688ae8)",
      "var(--color-charts-palette-categorical-2-ktit09, #c33d69)",
      "var(--color-charts-palette-categorical-3-g0srj0, #2ea597)",
      "var(--color-charts-palette-categorical-4-5vauwp, #8456ce)",
      "var(--color-charts-palette-categorical-5-3v8ery, #e07941)",
      "var(--color-charts-palette-categorical-6-ztdd8d, #3759ce)",
      "var(--color-charts-palette-categorical-7-3j5o6w, #962249)",
      "var(--color-charts-palette-categorical-8-c5r39m, #096f64)",
      "var(--color-charts-palette-categorical-9-8n6iuv, #6237a7)",
      "var(--color-charts-palette-categorical-10-opta0w, #a84401)",
      "var(--color-charts-palette-categorical-11-b2r7jc, #273ea5)",
      "var(--color-charts-palette-categorical-12-b5drtm, #780d35)",
      "var(--color-charts-palette-categorical-13-c69xg9, #03524a)",
      "var(--color-charts-palette-categorical-14-db19x8, #4a238b)",
      "var(--color-charts-palette-categorical-15-8z8vjw, #7e3103)",
      "var(--color-charts-palette-categorical-16-549jkl, #1b2b88)",
      "var(--color-charts-palette-categorical-17-nrio7t, #ce567c)",
      "var(--color-charts-palette-categorical-18-tm902v, #003e38)",
      "var(--color-charts-palette-categorical-19-ujcr86, #9469d6)",
      "var(--color-charts-palette-categorical-20-h55e4g, #602400)",
    ],
    legend: {
      enabled: false,
      align: "left",
      verticalAlign: "bottom",
      layout: "horizontal",
      itemStyle: {
        color: "var(--color-text-body-default-ryjct1, #0f141a)",
        fontFamily: "var(--font-family-base-4lwvpl, 'Amazon Ember', 'Helvetica Neue', Roboto, Arial, sans-serif)",
        fontSize: "var(--font-size-body-s-smc8cv, 12px)",
        fontWeight: "normal",
      },
      margin: 16,
      padding: 8,
      symbolWidth: 12,
      symbolHeight: 12,
      symbolRadius: 2,
      maxHeight: 100,
    },
    plotOptions: {
      series: {
        borderColor: "var(--color-border-divider-default-nfermc, #c6c6cd)",
        states: {
          hover: {
            enabled: true,
            lineWidth: 3,
            borderColor: "var(--color-border-segment-hover-941xea, #424650)",
          },
        },
        marker: {
          enabled: false,
          lineColor: "var(--color-border-divider-default-nfermc, #c6c6cd)",
          radius: 3,
          symbol: "circle",
        },
        connectNulls: false,
        lineWidth: 2,
        dashStyle: "Solid",
        visible: true,
        dataLabels: {
          enabled: false,
        },
        cursor: "pointer",
        point: {
          events: {},
        },
        cropThreshold: 1,
      },
      pie: {
        innerSize: "55%",
        dataLabels: {
          style: {
            color: "var(--color-text-body-default-ryjct1, #0f141a)",
            fontFamily: "var(--font-family-base-4lwvpl, 'Amazon Ember', 'Helvetica Neue', Roboto, Arial, sans-serif)",
          },
        },
        borderColor: "var(--color-border-divider-default-nfermc, #c6c6cd)",
      },
      solidgauge: {
        dataLabels: {
          style: {
            color: "var(--color-text-body-default-ryjct1, #0f141a)",
            fontFamily: "var(--font-family-base-4lwvpl, 'Amazon Ember', 'Helvetica Neue', Roboto, Arial, sans-serif)",
          },
        },
      },
      area: {
        fillOpacity: 0.25,
      },
      areaspline: {
        fillOpacity: 0.25,
      },
    },
    xAxis: {
      scrollbar: {
        enabled: false,
        barBackgroundColor: "var(--color-background-container-content-h114dj, #ffffff)",
        barBorderColor: "var(--color-border-divider-default-nfermc, #c6c6cd)",
        buttonBackgroundColor: "var(--color-background-container-content-h114dj, #ffffff)",
        buttonBorderColor: "var(--color-border-divider-default-nfermc, #c6c6cd)",
        trackBackgroundColor: "var(--color-charts-line-grid-kjxf3m, #dedee3)",
        trackBorderColor: "var(--color-charts-line-axis-b95ncf, #dedee3)",
      },
      crosshair: {
        snap: false,
        width: 1,
        color: "var(--color-charts-line-grid-kjxf3m, #dedee3)",
        label: {
          backgroundColor: "var(--color-background-popover-2f8egd, #ffffff)",
          borderColor: "var(--color-border-divider-default-nfermc, #c6c6cd)",
        },
      },
      tickmarkPlacement: "on",
      gridLineWidth: 0,
      dateTimeLabelFormats: {
        millisecond: "%b %e, %H:%M:%S.%L",
        second: "%b %e, %H:%M:%S",
        minute: "%b %e, %H:%M",
        hour: "%b %e, %H:%M",
        day: "%b %e",
        week: "%b %e",
        month: "%b %Y",
        year: "%Y",
      },
      labels: {
        format: "{value:%b %e,<br>%H:%M}",
      },
      min: 1672531200000,
      max: 1673136000000,
      visible: true,
      type: "datetime",
      plotLines: [],
      plotBands: [],
      events: {
        afterSetExtremes(e: any) {
          console.log(e);
          if (e.min !== 1672531200000 && e.max !== 1673136000000) {
            setIsChartZoomed(true);
          }
        },
      },
    },
    yAxis: {
      scrollbar: {
        enabled: false,
        barBackgroundColor: "var(--color-background-container-content-h114dj, #ffffff)",
        barBorderColor: "var(--color-border-divider-default-nfermc, #c6c6cd)",
        buttonBackgroundColor: "var(--color-background-container-content-h114dj, #ffffff)",
        buttonBorderColor: "var(--color-border-divider-default-nfermc, #c6c6cd)",
        trackBackgroundColor: "var(--color-charts-line-grid-kjxf3m, #dedee3)",
        trackBorderColor: "var(--color-charts-line-axis-b95ncf, #dedee3)",
      },
      opposite: false,
      crosshair: {
        snap: false,
        width: 1,
        color: "var(--color-charts-line-grid-kjxf3m, #dedee3)",
        label: {
          backgroundColor: "var(--color-background-popover-2f8egd, #ffffff)",
          borderColor: "var(--color-border-divider-default-nfermc, #c6c6cd)",
        },
      },
      gridLineWidth: 1,
      gridLineColor: "var(--color-charts-line-grid-kjxf3m, #dedee3)",
      lineColor: "var(--color-charts-line-axis-b95ncf, #dedee3)",
      tickColor: "var(--color-charts-line-tick-xmcbvk, #dedee3)",
      title: {
        text: "Value",
      },
      type: "linear",
      labels: {},
      visible: true,
      plotLines: [],
      plotBands: [],
    },
    title: {
      style: {
        color: "var(--color-text-body-default-ryjct1, #0f141a)",
        fontFamily: "var(--font-family-base-4lwvpl, 'Amazon Ember', 'Helvetica Neue', Roboto, Arial, sans-serif)",
      },
      text: "Zoom With Empty Series",
    },
    subtitle: {
      style: {
        color: "var(--color-text-body-default-ryjct1, #0f141a)",
        fontFamily: "var(--font-family-base-4lwvpl, 'Amazon Ember', 'Helvetica Neue', Roboto, Arial, sans-serif)",
        fontSize: "var(--font-size-body-s-smc8cv, 12px)",
      },
      text: "Test case for zooming with an empty series",
    },
    lang: {},
    navigator: {
      enabled: isChartZoomed,
    },
    series: [
      {
        name: "CPU Usage 0",
        type: "line",
        data: [
          [1672563600000, 128],
          [1672567200000, 115],
          [1672570800000, 128],
          [1672574400000, 116],
          [1672578000000, 117],
          [1672581600000, 128],
          [1672585200000, 111],
          [1672588800000, 115],
          [1672592400000, 119],
        ],
        marker: {
          enabled: false,
        },
        showInLegend: true,
      },
      {
        name: "Memory Usage 1",
        type: "line",
        data: [
          [1672563600000, 140],
          [1672567200000, 126],
          [1672570800000, 144],
          [1672574400000, 134],
          [1672578000000, 130],
          [1672581600000, 138],
          [1672585200000, 134],
          [1672588800000, 147],
          [1672592400000, 139],
        ],
        marker: {
          enabled: false,
        },
        showInLegend: true,
      },
      {
        name: "Disk Usage 2",
        type: "line",
        data: [
          [1672563600000, 165],
          [1672567200000, 168],
          [1672570800000, 146],
          [1672574400000, 165],
          [1672578000000, 156],
          [1672581600000, 161],
          [1672585200000, 175],
          [1672588800000, 170],
          [1672592400000, 170],
        ],
        marker: {
          enabled: false,
        },
        showInLegend: true,
      },
    ],
    time: {
      timezone: "UTC",
    },
  };

  const chartAPI = useRef<CoreChartProps.ChartAPI>(null);

  return (
    <Page
      title="Core chart demo"
      subtitle="The page demonstrates the use of the core chart, including additional legend settings."
      settings={
        <>
          <FormField label="Number of datapoints" description="Adjust the number of datapoints in the chart (1-1000)">
            <Input
              type="number"
              value={dataPointCount}
              onChange={({ detail }) => handleDataPointCountChange(detail.value)}
              placeholder="Enter a value between 1-1000"
            />
          </FormField>
          <PageSettingsForm
            selectedSettings={["showLegend", "legendPosition", "showLegendTitle", "showLegendActions", "useFallback"]}
          />
        </>
      }
    >
      <CoreChart
        {...omit(chartProps.cartesian, "ref")}
        highcharts={Highcharts}
        options={finalOptions}
        keyboardNavigation={true}
        verticalAxisTitlePlacement="side"
        chartHeight={400}
        tooltip={{ placement: "outside" }}
        callback={(chart) => {
          chartAPI.current = chart;
        }}
        getTooltipContent={() => ({
          point({ item }) {
            const value = item ? (item.point.y ?? null) : null;
            return {
              value: (
                <div>
                  {numberFormatter(value)} <Button variant="inline-icon" iconName="settings" />
                </div>
              ),
            };
          },
          footer() {
            return <Button>Footer action</Button>;
          },
        })}
        getLegendTooltipContent={({ legendItem }) => ({
          header: (
            <div>
              <div style={{ display: "flex" }}>
                {legendItem.marker}
                {legendItem.name}
              </div>
            </div>
          ),
          body: (
            <>
              <table>
                <tbody style={{ textAlign: "left" }}>
                  <tr>
                    <th scope="row">Period</th>
                    <td>15 min</td>
                  </tr>
                  <tr>
                    <th scope="row">Statistic</th>
                    <td>Average</td>
                  </tr>
                  <tr>
                    <th scope="row">Unit</th>
                    <td>Count</td>
                  </tr>
                </tbody>
              </table>
            </>
          ),
          footer: (
            <Link external={true} href="https://example.com/" variant="primary">
              Learn more
            </Link>
          ),
        })}
      />
    </Page>
  );
}
