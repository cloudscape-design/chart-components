// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef, useState } from "react";
import { range } from "lodash";

import { useMergeRefs } from "@cloudscape-design/component-toolkit/internal";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

import { CartesianChart, CartesianChartProps } from "../../lib/components";
import CoreChart from "../../lib/components/internal-do-not-use/core-chart";
import { CoreChartProps } from "../../src/core/interfaces";
import { dateFormatter, numberFormatter } from "../common/formatters";
import { SeriesFilter, useChartSettings } from "../common/page-settings";
import { FitSizeDemo, FramedDemo, Page, PageSection } from "../common/templates";
import pseudoRandom from "../utils/pseudo-random";

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// A fixed start date keeps the rendered chart, and the visual regression snapshots, stable.
const seriesStart = new Date("2025-01-01T00:00:00Z");

const zoomSeriesData = range(0, 100).map((i) => ({
  x: addDays(seriesStart, i).getTime(),
  y: Math.floor((pseudoRandom() + i / 50) * 100),
}));

const zoomSeries: CartesianChartProps.SeriesOptions[] = [
  { type: "area", name: "Requests", data: zoomSeriesData },
  {
    type: "spline",
    name: "Avg latency",
    data: zoomSeriesData.map((d) => ({ x: d.x, y: d.y * 0.6 + Math.floor(pseudoRandom() * 20) })),
  },
  { type: "y-threshold", name: "SLA limit", value: 150 },
];

// Pin the axis to the data range, as the other cartesian pages do. Without explicit bounds Highcharts
// derives the range from the data and pads it by 1% at each end, leaving a visible gap between the
// plot edges and the start and end of the series.
const zoomXAxis = {
  title: "Time",
  type: "datetime",
  valueFormatter: dateFormatter,
  min: zoomSeriesData[0].x,
  max: zoomSeriesData[zoomSeriesData.length - 1].x,
} as const;

const zoomYAxis = { title: "Count", type: "linear" } as const;

const SCENARIO_HEIGHT = 300;

export default function () {
  return (
    <Page
      title="Zoom"
      subtitle="This page demonstrates zooming into a range of the x-axis, and collects every scenario from the zoom bug bash so that each can be verified by hand."
    >
      {/* The main demo comes first, and directly under the page title, so that a functional test can drag
      across its plot without scrolling. Its documentation therefore follows it, rather than preceding it. */}
      <PageSection
        title="Full interaction"
        subtitle="Bug bash findings 2, 3, 4, 5, 6, 8, 9, 10, 13, and — with the app top bar toggles — 1 and 15."
      >
        <SpaceBetween size="s">
          <Button>Button before the chart</Button>
          <UncontrolledZoom />
          <Button>Button after the chart</Button>
        </SpaceBetween>
      </PageSection>

      <PageSection
        docs={{
          behavior: {
            bullets: [
              "Drag across the plot to zoom into a range. The range snaps to the data points it covers.",
              `Or use the "Zoom" button to enter zoom mode, where a cursor follows the pointer and the arrow keys
              that run along the x-axis. Home and End jump to the ends of the plot, Page Up and Page Down move in
              larger steps. A click, Enter, or Space sets the start of the range, and a second one sets the end,
              applying the zoom. This is a single-pointer, no-modifier interaction, satisfying WCAG 2.5.7
              (Dragging movements).`,
              `In zoom mode the tooltip is suppressed, and the buttons next to the cursor are a pointer-only
              alternative to the arrow keys and Enter. They stay out of the tab sequence, because the cursor itself
              holds the focus and offers the same actions. Escape, "Exit zoom", or moving the focus out of the chart
              cancels the selection.`,
              `While zoomed, "Reset" restores the full range, and "Zoom" stays available next to it, so a narrower
              range can be selected without resetting first. It is disabled once there is nothing left to zoom
              into.`,
              "The cursor position and the selected range are announced to screen readers as they change.",
            ],
          },
          custom: [
            {
              title: "What to verify here",
              bullets: [
                `Tab order (2): tabbing from the button before the chart reaches the zoom controls, then the plot,
                then the button after it, matching the order they are read in.`,
                `Keyboard boundaries (3, 5): after zooming, entering zoom mode again places the cursor on the first
                visible point, and the cursor cannot be driven outside the zoomed range.`,
                "Committed zoom (4): nothing of the selection stays drawn over the plot once the zoom is applied.",
                `Touch (6): with the browser's device emulation, or on a phone, the commit button next to the cursor
                sets both boundaries, so a range can be selected by tapping alone.`,
                `Focus (8, 10): clicking the controls does not move the focus to them; clicking the button after the
                chart, or anywhere outside it, cancels a selection in progress.`,
                `Focus target (9): entering zoom mode with the keyboard focuses the cursor, not "Exit zoom", so the
                next Enter sets the range start instead of cancelling.`,
                `Keyboard resilience (13): after a drag, a click on the plot, or a legend interaction, entering zoom
                mode again still moves the cursor with the arrow keys.`,
                `Dark mode (1) and RTL (15): toggle them in the app top bar. The controls keep sufficient contrast,
                and in RTL the cursor, its buttons, and the arrow keys all follow the axis as it now runs.`,
              ],
            },
          ],
        }}
      />

      <PageSection
        title="Few data points"
        subtitle="Bug bash findings 11 and 12."
        docs={{
          custom: [
            {
              title: "What to verify here",
              bullets: [
                `Three points leave one zoom to make. Once zoomed into two of them, "Zoom" is disabled, because
                there is no narrower range left to select (11).`,
                `A range must span at least two points: a drag or a pair of clicks over a single point keeps the
                start point instead of applying a zoom the chart cannot display or undo (12).`,
                "A short drag meant as a click still highlights the point, rather than zooming (12).",
              ],
            },
          ],
        }}
      >
        <FewPointsZoom />
      </PageSection>

      <PageSection
        title="No data"
        subtitle="Bug bash finding 7."
        docs={{
          custom: [
            {
              title: "What to verify here",
              bullets: [
                `An empty chart has nothing to zoom into, so "Zoom" is disabled, and nothing is drawn over the
                empty state (7).`,
                "The same holds for the loading and the error state.",
              ],
            },
          ],
        }}
      >
        <SpaceBetween size="l">
          <NoDataZoom statusType="finished" />
          <NoDataZoom statusType="loading" />
          <NoDataZoom statusType="error" />
        </SpaceBetween>
      </PageSection>

      <PageSection
        title="Series visibility"
        subtitle="Bug bash finding 7, and the edge cases of the bug bash checklist."
        docs={{
          custom: [
            {
              title: "What to verify here",
              bullets: [
                `Hiding all series leaves nothing to zoom into, so "Zoom" is disabled, and restoring a series
                enables it again (7).`,
                `Hiding a series while a range is being selected keeps the selection within the points that are
                left, and dropping a start point that is gone starts the selection over.`,
                "Hiding all series during a selection leaves zoom mode, and the announcement says so.",
              ],
            },
          ],
        }}
      >
        <FilteredZoom />
      </PageSection>

      <PageSection
        title="Dual axis, and a chart small enough to crowd the axis titles"
        subtitle="Bug bash findings 14 and 23."
        docs={{
          custom: [
            {
              title: "What to verify here",
              bullets: [
                "The zoom controls do not cover the title or the labels of either axis (14).",
                `In the small chart the controls stay clear of the left axis title, which is the case the other
                locales make worse, so it is worth re-checking with the i18n toggle in the app top bar (23).`,
              ],
            },
          ],
        }}
      >
        <SpaceBetween size="l">
          <DualAxisZoom />
          <SmallChartZoom />
        </SpaceBetween>
      </PageSection>

      <PageSection
        title="Legend on the side, and many series in a fit-height container"
        subtitle="Bug bash findings 16 and 17."
        docs={{
          custom: [
            {
              title: "What to verify here",
              bullets: [
                "The zoom controls do not overlay the legend when it sits next to the plot (16).",
                `The focus outline of the zoom controls and of the cursor is drawn in full, and is not cut off by
                the container the chart fits into (17).`,
              ],
            },
          ],
        }}
      >
        <SpaceBetween size="l">
          <SideLegendZoom />
          <ManySeriesZoom />
        </SpaceBetween>
      </PageSection>

      <PageSection
        title="Large series"
        subtitle="Bug bash findings 18 and 19."
        docs={{
          custom: [
            {
              title: "What to verify here",
              bullets: [
                `5,000 points, which is where zooming matters most. Page Up and Page Down move a tenth of the
                visible points at a time, and Home and End jump to the ends, so a range can be selected without
                stepping point by point (18).`,
                `Zooming again and again stops at two adjacent points, so repeated drags cannot narrow the range
                into a state the chart struggles to render (19).`,
              ],
            },
          ],
        }}
      >
        <LargeSeriesZoom />
      </PageSection>

      <PageSection
        title="Inverted chart"
        subtitle="Bug bash finding 20."
        docs={{
          custom: [
            {
              title: "What to verify here",
              bullets: [
                `With the axes swapped the cursor runs vertically, its buttons sit at the end of the cursor line,
                and the up and down arrow keys move it along the value axis (20).`,
                "A drag along the plot selects the range it covers, and the zoomed range matches the selection.",
              ],
            },
          ],
        }}
      >
        <InvertedZoom />
      </PageSection>

      <PageSection
        title="Grouped and stacked columns"
        subtitle="Bug bash finding 21."
        docs={{
          custom: [
            {
              title: "What to verify here",
              bullets: [
                `Zooming works on grouped and on stacked columns, over a category axis, with both the pointer and
                the keyboard: the cursor snaps to the columns, and the applied range shows only the columns it
                covers (21).`,
              ],
            },
          ],
        }}
      >
        <SpaceBetween size="l">
          <ColumnsZoom />
          <ColumnsZoom stacked={true} />
        </SpaceBetween>
      </PageSection>

      <PageSection
        title="Error bars"
        docs={{
          custom: [
            {
              title: "What to verify here",
              bullets: [
                `Error bar series carry no x values of their own, so they add no cursor stops: the cursor snaps to
                the points of the series they belong to.`,
              ],
            },
          ],
        }}
      >
        <ErrorBarsZoom />
      </PageSection>

      <PageSection
        title="Core chart"
        subtitle="Bug bash finding 22."
        docs={{
          custom: [
            {
              title: "What to verify here",
              bullets: [
                `Zooming is implemented by the core chart, so consumers of the core chart get the same interaction:
                the buttons, the cursor, the keyboard, and the announcements all behave as they do above (22).`,
              ],
            },
          ],
        }}
      >
        <CoreChartZoom />
      </PageSection>

      <PageSection
        title="Custom controls and a controlled range"
        subtitle="Bug bash finding 22."
        docs={{
          custom: [
            {
              title: "What to verify here",
              bullets: [
                `With "hideButtons" the built-in buttons are gone, and the buttons below drive the same interaction
                through the component's ref (22).`,
                `The range is owned by the page: every change is reported by "onZoomRangeChange" and shown below the
                chart, and "Show a fixed range" applies one without any interaction.`,
                "Cancelling a re-zoom with Escape keeps the range that is already applied.",
              ],
            },
          ],
        }}
      >
        <ControlledZoom />
      </PageSection>
    </Page>
  );
}

function UncontrolledZoom() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      data-testid="zoom-chart"
      chartHeight={400}
      zoom={{ enabled: true }}
      series={zoomSeries}
      xAxis={zoomXAxis}
      yAxis={zoomYAxis}
    />
  );
}

// Three points: enough for a single zoom, after which two are left and there is nothing to zoom into.
const fewPointsData = zoomSeriesData.slice(0, 3);

function FewPointsZoom() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={SCENARIO_HEIGHT}
      zoom={{ enabled: true }}
      ariaLabel="Chart with three data points"
      series={[{ type: "line", name: "Requests", data: fewPointsData }]}
      xAxis={{ ...zoomXAxis, min: fewPointsData[0].x, max: fewPointsData[fewPointsData.length - 1].x }}
      yAxis={zoomYAxis}
    />
  );
}

function NoDataZoom({ statusType }: { statusType: "finished" | "loading" | "error" }) {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={SCENARIO_HEIGHT}
      zoom={{ enabled: true }}
      ariaLabel={`Chart with no data, ${statusType}`}
      series={[]}
      xAxis={zoomXAxis}
      yAxis={zoomYAxis}
      noData={{
        statusType,
        empty: (
          <Box textAlign="center" color="inherit">
            <b>No data available</b>
          </Box>
        ),
        loading: <StatusIndicator type="loading">Loading data...</StatusIndicator>,
        error: <StatusIndicator type="error">An error occurred</StatusIndicator>,
      }}
    />
  );
}

const filteredSeriesNames = ["Requests", "Avg latency", "SLA limit"];

function FilteredZoom() {
  const { chartProps } = useChartSettings();
  const [visibleSeries, setVisibleSeries] = useState(filteredSeriesNames);
  return (
    <SpaceBetween size="s">
      <SeriesFilter
        allSeries={filteredSeriesNames}
        visibleSeries={visibleSeries}
        onVisibleSeriesChange={setVisibleSeries}
      />
      <CartesianChart
        {...chartProps.cartesian}
        chartHeight={SCENARIO_HEIGHT}
        zoom={{ enabled: true }}
        ariaLabel="Chart with a series filter"
        series={zoomSeries}
        visibleSeries={visibleSeries}
        onVisibleSeriesChange={({ detail }) => setVisibleSeries(detail.visibleSeries)}
        xAxis={zoomXAxis}
        yAxis={zoomYAxis}
      />
    </SpaceBetween>
  );
}

function DualAxisZoom() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={SCENARIO_HEIGHT}
      zoom={{ enabled: true }}
      ariaLabel="Dual-axis chart"
      series={[
        { type: "line", name: "Requests", yAxis: "count", data: zoomSeriesData },
        {
          type: "line",
          name: "Error rate",
          yAxis: "percentage",
          dashStyle: "Dash",
          data: zoomSeriesData.map((d) => ({ x: d.x, y: d.y / 20 })),
        },
      ]}
      xAxis={zoomXAxis}
      yAxis={[
        { id: "count", title: "Count" },
        { id: "percentage", title: "Error rate (%)" },
      ]}
    />
  );
}

function SmallChartZoom() {
  const { chartProps } = useChartSettings();
  return (
    <FitSizeDemo height={200} width={320}>
      <CartesianChart
        {...chartProps.cartesian}
        fitHeight={true}
        chartHeight={100}
        zoom={{ enabled: true }}
        verticalAxisTitlePlacement="side"
        ariaLabel="Small chart with side axis titles"
        series={[{ type: "line", name: "Requests", data: zoomSeriesData }]}
        xAxis={zoomXAxis}
        yAxis={zoomYAxis}
      />
    </FitSizeDemo>
  );
}

// The legend position is not part of the cartesian chart's public API, so it is declared through the core
// chart's options, as the page settings do.
const sideLegend: CoreChartProps.LegendOptions = { enabled: true, position: "side" };

function SideLegendZoom() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={SCENARIO_HEIGHT}
      zoom={{ enabled: true }}
      legend={sideLegend}
      ariaLabel="Chart with the legend on the side"
      series={zoomSeries}
      xAxis={zoomXAxis}
      yAxis={zoomYAxis}
    />
  );
}

// Enough series to fill the legend, over the same x values, so the cursor still steps a point at a time.
const manySeries: CartesianChartProps.SeriesOptions[] = range(0, 12).map((index) => ({
  type: "areaspline",
  name: `Availability zone ${index + 1}`,
  data: zoomSeriesData.slice(0, 40).map((d) => ({ x: d.x, y: d.y + Math.floor(pseudoRandom() * 50 * (index + 1)) })),
}));

function ManySeriesZoom() {
  const { chartProps } = useChartSettings();
  return (
    // The frame clips whatever leaves it, which is what would cut off a focus outline drawn at the edge of
    // the plot. Its size is not annotated, so that nothing is laid over the controls being verified.
    <FramedDemo>
      <div style={{ blockSize: SCENARIO_HEIGHT }}>
        <CartesianChart
          {...chartProps.cartesian}
          fitHeight={true}
          chartHeight={100}
          stacking="normal"
          zoom={{ enabled: true }}
          ariaLabel="Chart with many series"
          series={manySeries}
          xAxis={{ ...zoomXAxis, min: zoomSeriesData[0].x, max: zoomSeriesData[39].x }}
          yAxis={zoomYAxis}
        />
      </div>
    </FramedDemo>
  );
}

// Five-minute intervals over roughly seventeen days: more points than the plot has pixels, so the cursor
// cannot be stepped through them one by one in reasonable time.
const largeSeriesData = range(0, 5000).map((i) => ({
  x: seriesStart.getTime() + i * 5 * 60 * 1000,
  y: Math.floor((pseudoRandom() + i / 2500) * 100),
}));

function LargeSeriesZoom() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={SCENARIO_HEIGHT}
      zoom={{ enabled: true }}
      ariaLabel="Chart with a large series"
      series={[{ type: "line", name: "Requests", data: largeSeriesData }]}
      xAxis={{
        ...zoomXAxis,
        min: largeSeriesData[0].x,
        max: largeSeriesData[largeSeriesData.length - 1].x,
      }}
      yAxis={zoomYAxis}
    />
  );
}

function InvertedZoom() {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={400}
      inverted={true}
      zoom={{ enabled: true }}
      ariaLabel="Inverted chart"
      series={zoomSeries}
      xAxis={zoomXAxis}
      yAxis={zoomYAxis}
    />
  );
}

const columnCategories = ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8"];
const columnSeries: CartesianChartProps.SeriesOptions[] = ["Compute", "Storage", "Network"].map((name, index) => ({
  type: "column",
  name,
  data: columnCategories.map(() => Math.floor(1000 + pseudoRandom() * 5000 * (index + 1))),
}));

function ColumnsZoom({ stacked = false }: { stacked?: boolean }) {
  const { chartProps } = useChartSettings();
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={SCENARIO_HEIGHT}
      zoom={{ enabled: true }}
      stacking={stacked ? "normal" : undefined}
      ariaLabel={stacked ? "Stacked column chart" : "Grouped column chart"}
      series={columnSeries}
      xAxis={{ type: "category", title: "Quarter", categories: columnCategories }}
      yAxis={{ title: "Costs (USD)", valueFormatter: numberFormatter }}
    />
  );
}

const errorBarsData = zoomSeriesData.slice(0, 20);

function ErrorBarsZoom() {
  // Error bars come from the highcharts-more module, which this page only needs for this one chart.
  const { chartProps } = useChartSettings({ more: true });
  return (
    <CartesianChart
      {...chartProps.cartesian}
      chartHeight={SCENARIO_HEIGHT}
      zoom={{ enabled: true }}
      ariaLabel="Chart with error bars"
      series={[
        { type: "line", id: "requests", name: "Requests", data: errorBarsData },
        {
          type: "errorbar",
          name: "Requests error",
          linkedTo: "requests",
          // The x values are spelled out, because the error bars sit on a datetime axis rather than on the
          // categories they would otherwise be indexed by.
          data: errorBarsData.map((d) => ({ x: d.x, low: d.y * 0.8, high: d.y * 1.2 })),
        },
      ]}
      xAxis={{ ...zoomXAxis, min: errorBarsData[0].x, max: errorBarsData[errorBarsData.length - 1].x }}
      yAxis={zoomYAxis}
    />
  );
}

function CoreChartZoom() {
  const { chartProps } = useChartSettings();
  return (
    <CoreChart
      {...chartProps.core}
      chartHeight={SCENARIO_HEIGHT}
      zoom={{ enabled: true }}
      options={{
        lang: { accessibility: { chartContainerLabel: "Core chart with zoom" } },
        series: [{ type: "line", name: "Requests", data: zoomSeriesData }],
        xAxis: [{ type: "datetime", title: { text: "Time" }, valueFormatter: dateFormatter }],
        yAxis: [{ title: { text: "Count" } }],
      }}
    />
  );
}

// A range in the middle of the data, to apply from outside the chart.
const fixedZoomRange: CartesianChartProps.ZoomRange = {
  x: { startValue: zoomSeriesData[40].x, endValue: zoomSeriesData[60].x },
};

function ControlledZoom() {
  const { chartProps } = useChartSettings();
  const chartRef = useRef<CartesianChartProps.Ref>(null);
  // The page settings own a ref of their own, which the "Clear filter" action of the no-match state uses.
  const ref = useMergeRefs(chartRef, chartProps.cartesian.ref);
  const [zoomRange, setZoomRange] = useState<null | CartesianChartProps.ZoomRange>(null);
  return (
    <SpaceBetween size="s">
      <CartesianChart
        {...chartProps.cartesian}
        ref={ref}
        chartHeight={SCENARIO_HEIGHT}
        zoom={{ enabled: true, hideButtons: true }}
        zoomRange={zoomRange}
        onZoomRangeChange={({ detail }) => setZoomRange(detail.zoomRange)}
        ariaLabel="Chart with custom zoom controls"
        series={zoomSeries}
        xAxis={zoomXAxis}
        yAxis={zoomYAxis}
      />

      <SpaceBetween size="xs" direction="horizontal">
        <Button onClick={() => chartRef.current?.enterZoomMode()}>Enter zoom mode</Button>
        <Button onClick={() => chartRef.current?.exitZoomMode()}>Exit zoom mode</Button>
        <Button onClick={() => chartRef.current?.resetZoom()}>Reset zoom</Button>
        <Button onClick={() => setZoomRange(fixedZoomRange)}>Show a fixed range</Button>
      </SpaceBetween>

      <Box color="text-body-secondary">
        {zoomRange?.x
          ? `Zoomed from ${dateFormatter(zoomRange.x.startValue)} to ${dateFormatter(zoomRange.x.endValue)}`
          : "Showing the full data range"}
      </Box>
    </SpaceBetween>
  );
}
