// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { act } from "react";
import highcharts from "highcharts";
import { vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "highcharts/highcharts-more";
import "highcharts/modules/accessibility";
import { createChartWrapper, hoverLegendItem, leaveLegendItem, renderChart } from "./common";
import { HighchartsTestHelper } from "./highcharts-utils";

const hc = new HighchartsTestHelper(highcharts);

beforeAll(() => {
  vi.useFakeTimers();
});

afterAll(() => {
  vi.useRealTimers();
});

// Series layout used across tests:
//   index 0 → L1 (master)
//   index 1 → L2 (linked to L1)
//   index 2 → L3 (independent)
const linkedSeries: Highcharts.SeriesOptionsType[] = [
  { type: "line", id: "l1", name: "L1", data: [1, 2], showInLegend: true },
  { type: "line", id: "l2", name: "L2", data: [3, 4], linkedTo: "l1", showInLegend: false },
  { type: "line", id: "l3", name: "L3", data: [5, 6], showInLegend: true },
];

describe("CoreChart: linked series — hover", () => {
  test("hovering a point on master series also sets linked series to hover", async () => {
    renderChart({ highcharts, options: { series: linkedSeries } });

    act(() => hc.highlightChartPoint(0, 0));

    expect(hc.getChartSeries(0).state).toBe("hover");
    expect(hc.getChartSeries(1).state).toBe("hover");
    expect(hc.getChartSeries(2).state).toBe("inactive");

    act(() => hc.leaveChartPoint(0, 0));
    await hc.clearHighlightPause();

    expect(hc.getChartSeries(0).state).toBe("");
    expect(hc.getChartSeries(1).state).toBe("");
    expect(hc.getChartSeries(2).state).toBe("");
  });

  test("hovering a point on linked series also sets master series to hover", async () => {
    renderChart({ highcharts, options: { series: linkedSeries } });

    act(() => hc.highlightChartPoint(1, 0));

    expect(hc.getChartSeries(0).state).toBe("hover");
    expect(hc.getChartSeries(1).state).toBe("hover");
    expect(hc.getChartSeries(2).state).toBe("inactive");

    act(() => hc.leaveChartPoint(1, 0));
    await hc.clearHighlightPause();

    expect(hc.getChartSeries(0).state).toBe("");
    expect(hc.getChartSeries(1).state).toBe("");
    expect(hc.getChartSeries(2).state).toBe("");
  });

  test("hovering an independent series does not affect linked family", async () => {
    renderChart({ highcharts, options: { series: linkedSeries } });

    act(() => hc.highlightChartPoint(2, 0));

    expect(hc.getChartSeries(0).state).toBe("inactive");
    expect(hc.getChartSeries(1).state).toBe("inactive");
    expect(hc.getChartSeries(2).state).toBe("hover");

    act(() => hc.leaveChartPoint(2, 0));
    await hc.clearHighlightPause();

    expect(hc.getChartSeries(0).state).toBe("");
    expect(hc.getChartSeries(1).state).toBe("");
    expect(hc.getChartSeries(2).state).toBe("");
  });
});

describe("CoreChart: linked series — legend", () => {
  test("linked series does not appear as a legend item", () => {
    const { wrapper } = renderChart({ highcharts, options: { series: linkedSeries } });
    const legendItems = wrapper.findLegend()!.findItems();
    // Only L1 and L3 should appear; L2 (linked) must not
    expect(legendItems).toHaveLength(2);
    expect(legendItems[0].getElement().textContent).toContain("L1");
    expect(legendItems[1].getElement().textContent).toContain("L3");
  });

  test("hovering master legend item highlights master and linked series", async () => {
    renderChart({ highcharts, options: { series: linkedSeries } });

    hoverLegendItem(0); // hover L1

    expect(hc.getChartSeries(0).state).toBe(""); // master — active
    expect(hc.getChartSeries(1).state).toBe(""); // linked — active
    expect(hc.getChartSeries(2).state).toBe("inactive");

    leaveLegendItem(0);
    await hc.clearHighlightPause();

    expect(hc.getChartSeries(0).state).toBe("");
    expect(hc.getChartSeries(1).state).toBe("");
    expect(hc.getChartSeries(2).state).toBe("");
  });

  test("hovering independent legend item dims master and linked series", async () => {
    renderChart({ highcharts, options: { series: linkedSeries } });

    hoverLegendItem(1); // hover L3

    expect(hc.getChartSeries(0).state).toBe("inactive");
    expect(hc.getChartSeries(1).state).toBe("inactive");
    expect(hc.getChartSeries(2).state).toBe("");

    leaveLegendItem(1);
    await hc.clearHighlightPause();

    expect(hc.getChartSeries(0).state).toBe("");
    expect(hc.getChartSeries(1).state).toBe("");
    expect(hc.getChartSeries(2).state).toBe("");
  });
});

describe("CoreChart: linked series — keyboard navigation", () => {
  function focusApplication() {
    createChartWrapper().findApplication()!.focus();
  }
  function keyDown(keyCode: number) {
    createChartWrapper().findApplication()!.keydown(keyCode);
  }
  function describeFocusedElement() {
    const el = document.activeElement!;
    const role = el.getAttribute("role") ?? el.tagName.toLowerCase();
    const ariaLabel = el.getAttribute("aria-label") ?? "X";
    const hasPopup = el.getAttribute("aria-haspopup");
    const expanded = el.getAttribute("aria-expanded");
    return hasPopup !== null ? `${role}:${ariaLabel}[${hasPopup},${expanded}]` : `${role}:${ariaLabel}`;
  }

  // Series layout:
  //   index 0 → Primary (master), x=1,2
  //   index 1 → Projected (linked to Primary), x=1,2  — all X overlap with primary, so Projected is fully deduped
  //   index 2 → Other (independent), x=1,2
  const series: Highcharts.SeriesOptionsType[] = [
    {
      type: "line",
      id: "primary",
      name: "Primary",
      data: [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
      ],
    },
    {
      type: "line",
      id: "projected",
      name: "Projected",
      data: [
        { x: 1, y: 15 },
        { x: 2, y: 25 },
      ],
      linkedTo: "primary",
      showInLegend: false,
    },
    {
      type: "line",
      id: "other",
      name: "Other",
      data: [
        { x: 1, y: 30 },
        { x: 2, y: 40 },
      ],
    },
  ];

  test("when primary and linked series share all X values, series nav stays on primary only", () => {
    renderChart({ highcharts, options: { series }, ariaLabel: "Test chart" });

    focusApplication();
    keyDown(KeyCode.home); // group at x=1
    keyDown(KeyCode.down); // enter point — lands on Primary x=1

    expect(describeFocusedElement()).toContain("Primary");

    // Primary wins at every X, so Projected is fully deduped — nav cycles Primary(x=1) → Primary(x=2) → wraps
    keyDown(KeyCode.right); // Primary x=2
    expect(describeFocusedElement()).toContain("Primary");

    keyDown(KeyCode.right); // wraps back to Primary x=1
    expect(describeFocusedElement()).toContain("Primary");
  });

  // Series layout for partial-overlap test:
  //   Primary: x=1,2  |  Projected (linked): x=2,3  — x=2 is shared (primary wins), x=3 is linked-only
  const seriesPartialOverlap: Highcharts.SeriesOptionsType[] = [
    {
      type: "line",
      id: "p",
      name: "Primary",
      data: [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
      ],
    },
    {
      type: "line",
      id: "proj",
      name: "Projected",
      data: [
        { x: 2, y: 25 },
        { x: 3, y: 35 },
      ],
      linkedTo: "p",
      showInLegend: false,
    },
  ];

  test("primary wins at shared X; linked-only X values remain navigable", () => {
    renderChart({ highcharts, options: { series: seriesPartialOverlap }, ariaLabel: "Test chart" });

    focusApplication();
    keyDown(KeyCode.home); // group at x=1
    keyDown(KeyCode.down); // enter point — Primary x=1

    expect(describeFocusedElement()).toContain("Primary");

    keyDown(KeyCode.right); // Primary x=2 (wins over Projected x=2)
    expect(describeFocusedElement()).toContain("Primary");

    keyDown(KeyCode.right); // Projected x=3 (linked-only, no primary point here)
    expect(describeFocusedElement()).toContain("Projected");

    keyDown(KeyCode.right); // wraps back to Primary x=1
    expect(describeFocusedElement()).toContain("Primary");
  });

  test("linked series point is reachable from group navigation and can navigate back to master", () => {
    renderChart({ highcharts, options: { series }, ariaLabel: "Test chart" });

    focusApplication();
    keyDown(KeyCode.home); // group at x=1
    keyDown(KeyCode.up); // last point in group — Other x=1

    expect(describeFocusedElement()).toContain("Other");

    // Navigate up within group to reach Projected, then Primary
    keyDown(KeyCode.up); // Projected x=1
    expect(describeFocusedElement()).toContain("Projected");

    // From Projected, navigate backwards in series — should reach Primary
    keyDown(KeyCode.left); // wraps to last in family: Projected x=2
    keyDown(KeyCode.left); // Projected x=1
    keyDown(KeyCode.left); // Primary x=2
    expect(describeFocusedElement()).toContain("Primary");
  });
});
