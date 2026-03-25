// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";
import { vi } from "vitest";

import testClasses from "../../../lib/components/core/test-classes/styles.selectors";
import { renderChart } from "./common";
import { HighchartsTestHelper } from "./highcharts-utils";

const hc = new HighchartsTestHelper(highcharts);

function createMouseMoveEvent({ pageX, pageY }: { pageX: number; pageY: number }) {
  const event = new MouseEvent("mousemove", { clientX: 0, clientY: 0, bubbles: true, cancelable: true });
  Object.defineProperty(event, "pageX", {
    get() {
      return pageX;
    },
  });
  Object.defineProperty(event, "pageY", {
    get() {
      return pageY;
    },
  });
  return event;
}

function mockPointCoordinates() {
  hc.getChart().series.forEach((s, sIndex) => {
    s.points.forEach((p) => {
      p.plotX = 0;
      p.plotY = 1 + sIndex;
    });
  });
}

describe("CoreChart: invisible and destroyed points", () => {
  test("does not throw when clearing highlight with null points in series data", async () => {
    vi.useFakeTimers();
    renderChart({
      highcharts,
      options: {
        series: [
          { type: "column", name: "C1", data: [1, 2] },
          { type: "column", name: "C2", data: [3, 4] },
        ],
      },
    });

    act(() => hc.highlightChartPoint(1, 0));

    // Inject null into series data to simulate destroyed point.
    (hc.getChartSeries(0).data as Array<Highcharts.Point | null>).push(null);

    expect(hc.getChartSeries(0).state).toBe("inactive");
    expect(hc.getChartSeries(1).state).toBe("hover");

    // Clearing highlight iterates all points in all series.
    // Before the fix, null points would cause a TypeError.
    expect(() => {
      act(() => hc.leaveChartPoint(1, 0));
    }).not.toThrow();

    await hc.clearHighlightPause();

    expect(hc.getChartSeries(0).state).toBe("");
    expect(hc.getChartSeries(1).state).toBe("");
    expect(hc.getChartPoint(0, 0).state).toBe("");
    expect(hc.getChartPoint(0, 1).state).toBe("");
    vi.useRealTimers();
  });

  test("does not render highlight markers for invisible points", () => {
    const { wrapper } = renderChart({
      highcharts,
      options: {
        series: [
          { type: "scatter", name: "S1", data: [{ x: 1, y: 11 }] },
          { type: "scatter", name: "S2", data: [{ x: 1, y: 21 }] },
          { type: "scatter", name: "S3", data: [{ x: 1, y: 31 }] },
        ],
        chart: {
          events: {
            load() {
              hc.getChart().plotTop = 0;
              hc.getChart().plotLeft = 0;
              hc.getChart().plotWidth = 100;
              hc.getChart().plotHeight = 100;
            },
          },
        },
      },
      getTooltipContent: () => ({ header: () => "Header", body: () => "Body" }),
    });

    // Mark the second point as invisible.
    (hc.getChartPoint(1, 0) as any).visible = false;

    mockPointCoordinates();
    act(() => hc.getChart().container.dispatchEvent(createMouseMoveEvent({ pageX: 0, pageY: 1 })));

    // Only 2 markers should render (S1 and S3), not 3.
    expect(wrapper.findAllByClassName(testClasses["highlight-marker"])).toHaveLength(2);
  });

  test("does not render highlight markers for points in invisible series", () => {
    const { wrapper } = renderChart({
      highcharts,
      options: {
        series: [
          { type: "scatter", name: "S1", data: [{ x: 1, y: 11 }] },
          { type: "scatter", name: "S2", data: [{ x: 1, y: 21 }] },
          { type: "scatter", name: "S3", data: [{ x: 1, y: 31 }] },
        ],
        chart: {
          events: {
            load() {
              hc.getChart().plotTop = 0;
              hc.getChart().plotLeft = 0;
              hc.getChart().plotWidth = 100;
              hc.getChart().plotHeight = 100;
            },
          },
        },
      },
      getTooltipContent: () => ({ header: () => "Header", body: () => "Body" }),
    });

    // Make the second series invisible.
    (hc.getChartSeries(1) as any).visible = false;

    mockPointCoordinates();
    act(() => hc.getChart().container.dispatchEvent(createMouseMoveEvent({ pageX: 0, pageY: 1 })));

    expect(wrapper.findAllByClassName(testClasses["highlight-marker"])).toHaveLength(2);
  });

  test("excludes invisible points from tooltip series items", async () => {
    const { wrapper } = renderChart({
      highcharts,
      options: {
        series: [
          {
            type: "line",
            name: "Line series 1",
            data: [
              { x: 1, y: 11 },
              { x: 2, y: 12 },
            ],
          },
          {
            type: "line",
            name: "Line series 2",
            data: [
              { x: 1, y: 21 },
              { x: 2, y: 22 },
            ],
          },
          {
            type: "line",
            name: "Line series 3",
            data: [
              { x: 1, y: 31 },
              { x: 2, y: 32 },
            ],
          },
        ],
      },
      getTooltipContent: () => ({
        header: () => "Header",
        body: ({ items }) => (
          <div>
            {items.map((item, i) => (
              <div key={i} data-testid={`series-${i}`}>
                {item.point.series.name}: {item.point.y}
              </div>
            ))}
          </div>
        ),
      }),
    });

    // Make the second series' point at x=1 invisible.
    (hc.getChartPoint(1, 0) as any).visible = false;

    act(() => hc.highlightChartPoint(0, 0));

    await waitFor(() => {
      expect(wrapper.findTooltip()).not.toBe(null);
    });

    // Tooltip should only contain items from series 1 and 3, not series 2.
    const series0 = wrapper.findTooltip()!.find('[data-testid="series-0"]');
    const series1 = wrapper.findTooltip()!.find('[data-testid="series-1"]');
    const series2 = wrapper.findTooltip()!.find('[data-testid="series-2"]');

    expect(series0!.getElement().textContent).toBe("Line series 1: 11");
    expect(series1!.getElement().textContent).toBe("Line series 3: 31");
    expect(series2).toBe(null);
  });
});
