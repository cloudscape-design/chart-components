// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";
import { range } from "lodash";
import { vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "highcharts/modules/accessibility";
import { CoreChartProps } from "../../../lib/components/core/interfaces";
import { createChartWrapper, renderChart } from "./common";

const seriesShort2: Highcharts.SeriesOptionsType[] = [
  {
    type: "line",
    name: "Line series 1",
    data: [
      { x: 1, y: 11 },
      { x: 2, y: 12 },
      { x: 3, y: 13 },
    ],
  },
  {
    type: "line",
    name: "Line series 2",
    data: [
      { x: 1, y: 21 },
      { x: 3, y: 23 },
      { x: 4, y: 24 },
    ],
  },
];
const seriesShort3: Highcharts.SeriesOptionsType[] = [
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
];
const seriesLong1: Highcharts.SeriesOptionsType[] = [
  {
    type: "line",
    name: "Line series 1",
    data: range(1, 1001).map((x) => ({ x, y: -x })),
  },
];
function commonProps(invertedSetting: boolean | "random" = false, series = seriesShort2): CoreChartProps {
  const inverted = invertedSetting === "random" ? Math.random() > 0.5 : invertedSetting;
  return {
    highcharts,
    options: { chart: { inverted }, series, xAxis: { title: { text: "X" } }, yAxis: { title: { text: "Y" } } },
    ariaLabel: "Test chart",
    i18nStrings: { detailPopoverDismissAriaLabel: "Unpin tooltip" },
  };
}
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

describe("CoreChart: navigation, cartesian charts", () => {
  let mockState = { isRtl: false as boolean | "random" };

  beforeEach(() => {
    mockState = { isRtl: false };
    vi.stubGlobal(
      "getComputedStyle",
      vi.fn(() => {
        const isRtl = mockState.isRtl === "random" ? Math.random() > 0.5 : mockState.isRtl;
        return {
          getPropertyValue: () => "",
          direction: isRtl ? "rtl" : "ltr",
        } as unknown as CSSStyleDeclaration;
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("focuses chart application", () => {
    const { wrapper } = renderChart(commonProps());

    focusApplication();

    expect(describeFocusedElement()).toBe("application:Test chart");
    expect(wrapper.findTooltip()).toBe(null);
  });

  test.each([
    { keyCode: KeyCode.space, isRtl: "random" as const, inverted: "random" as const },
    { keyCode: KeyCode.enter, isRtl: "random" as const, inverted: "random" as const },
    { keyCode: KeyCode.right, isRtl: false, inverted: "random" as const },
    { keyCode: KeyCode.left, isRtl: true, inverted: "random" as const },
    { keyCode: KeyCode.down, isRtl: "random" as const, inverted: "random" as const },
    { keyCode: KeyCode.home, isRtl: "random" as const, inverted: "random" as const },
  ])(
    "moves focus to the first group, keyCode=$keyCode, isRtl=$isRtl, inverted=$inverted",
    ({ keyCode, isRtl, inverted }) => {
      mockState.isRtl = isRtl;
      const { wrapper } = renderChart(commonProps(inverted));

      focusApplication();
      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 111Line series 221");
    },
  );

  test.each([
    { keyCode: KeyCode.left, isRtl: false, inverted: "random" as const },
    { keyCode: KeyCode.right, isRtl: true, inverted: "random" as const },
    { keyCode: KeyCode.up, isRtl: "random" as const, inverted: "random" as const },
    { keyCode: KeyCode.end, isRtl: "random" as const, inverted: "random" as const },
  ])(
    "moves focus to the last group, keyCode=$keyCode, isRtl=$isRtl, inverted=$inverted",
    ({ keyCode, isRtl, inverted }) => {
      mockState.isRtl = isRtl;
      const { wrapper } = renderChart(commonProps(inverted));

      focusApplication();
      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:4[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("4Line series 224");
    },
  );

  test.each([
    { keyCode: KeyCode.right, isRtl: false, inverted: false },
    { keyCode: KeyCode.left, isRtl: true, inverted: false },
    { keyCode: KeyCode.down, isRtl: "random" as const, inverted: true },
  ])(
    "moves focus to the next group, keyCode=$keyCode, isRtl=$isRtl, inverted=$inverted",
    ({ keyCode, isRtl, inverted }) => {
      mockState.isRtl = isRtl;
      const { wrapper } = renderChart(commonProps(inverted));

      focusApplication();
      keyDown(KeyCode.enter);
      keyDown(KeyCode.home);

      expect(describeFocusedElement()).toBe("button:1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 111Line series 221");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:2[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("2Line series 112");

      keyDown(keyCode);
      keyDown(keyCode);
      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 111Line series 221");
    },
  );

  test.each([
    { keyCode: KeyCode.left, isRtl: false, inverted: false },
    { keyCode: KeyCode.right, isRtl: true, inverted: false },
    { keyCode: KeyCode.up, isRtl: "random" as const, inverted: true },
  ])(
    "moves focus to the prev group, keyCode=$keyCode, isRtl=$isRtl, inverted=$inverted",
    ({ keyCode, isRtl, inverted }) => {
      mockState.isRtl = isRtl;
      const { wrapper } = renderChart(commonProps(inverted));

      focusApplication();
      keyDown(KeyCode.enter);
      keyDown(KeyCode.end);

      expect(describeFocusedElement()).toBe("button:4[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("4Line series 224");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:3[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("3Line series 113Line series 223");

      keyDown(keyCode);
      keyDown(keyCode);
      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:4[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("4Line series 224");
    },
  );

  test.each([
    { keyCode: KeyCode.down, isRtl: false, inverted: false },
    { keyCode: KeyCode.down, isRtl: true, inverted: false },
    { keyCode: KeyCode.left, isRtl: false, inverted: true },
    { keyCode: KeyCode.right, isRtl: true, inverted: true },
  ])(
    "moves focus to the first point inside group, keyCode=$keyCode, isRtl=$isRtl, inverted=$inverted",
    ({ keyCode, isRtl, inverted }) => {
      mockState.isRtl = isRtl;
      const { wrapper } = renderChart(commonProps(inverted));

      focusApplication();
      keyDown(KeyCode.home);

      expect(describeFocusedElement()).toBe("button:1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 111Line series 221");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:1 11, Line series 1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 111Line series 221");
    },
  );

  test.each([
    { keyCode: KeyCode.up, isRtl: true, inverted: false },
    { keyCode: KeyCode.up, isRtl: false, inverted: false },
    { keyCode: KeyCode.right, isRtl: false, inverted: true },
    { keyCode: KeyCode.left, isRtl: true, inverted: true },
  ])(
    "moves focus to the last point inside group, keyCode=$keyCode, isRtl=$isRtl, inverted=$inverted",
    ({ keyCode, isRtl, inverted }) => {
      mockState.isRtl = isRtl;
      const { wrapper } = renderChart(commonProps(inverted));

      focusApplication();
      keyDown(KeyCode.home);

      expect(describeFocusedElement()).toBe("button:1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 111Line series 221");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:1 21, Line series 2[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 111Line series 221");
    },
  );

  test.each([{ keyCode: KeyCode.pageDown, isRtl: "random" as const, inverted: "random" as const }])(
    "moves focus to the next group page, keyCode=$keyCode, isRtl=$isRtl, inverted=$inverted",
    ({ keyCode, isRtl, inverted }) => {
      mockState.isRtl = isRtl;
      const { wrapper } = renderChart(commonProps(inverted, seriesLong1));

      focusApplication();
      keyDown(KeyCode.home);

      expect(describeFocusedElement()).toBe("button:1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 1-1");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:51[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("51Line series 1-51");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:101[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("101Line series 1-101");

      range(20).forEach(() => keyDown(keyCode));

      expect(describeFocusedElement()).toBe("button:1K[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1KLine series 1-1K");
    },
  );

  test.each([{ keyCode: KeyCode.pageUp, isRtl: "random" as const, inverted: "random" as const }])(
    "moves focus to the prev group page, keyCode=$keyCode, isRtl=$isRtl, inverted=$inverted",
    ({ keyCode, isRtl, inverted }) => {
      mockState.isRtl = isRtl;
      const { wrapper } = renderChart(commonProps(inverted, seriesLong1));

      focusApplication();
      keyDown(KeyCode.end);

      expect(describeFocusedElement()).toBe("button:1K[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1KLine series 1-1K");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:950[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("950Line series 1-950");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:900[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("900Line series 1-900");

      range(20).forEach(() => keyDown(keyCode));

      expect(describeFocusedElement()).toBe("button:1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 1-1");
    },
  );

  test("moves focus from group to chart", () => {
    const { wrapper } = renderChart(commonProps());

    focusApplication();
    keyDown(KeyCode.enter);

    expect(describeFocusedElement()).toBe("button:1[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 111Line series 221");

    keyDown(KeyCode.escape);

    expect(describeFocusedElement()).toBe("application:Test chart");
    expect(wrapper.findTooltip()).toBe(null);
  });

  test("pins popover at group", () => {
    const { wrapper } = renderChart(commonProps());

    focusApplication();
    keyDown(KeyCode.enter);

    expect(describeFocusedElement()).toBe("button:1[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 111Line series 221");
    expect(wrapper.findTooltip()!.findDismissButton()).toBe(null);

    keyDown(KeyCode.enter);

    expect(describeFocusedElement()).toBe("button:Unpin tooltip");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 111Line series 221");
    expect(wrapper.findTooltip()!.findDismissButton()).not.toBe(null);
  });

  test.each([
    { enterKeyCode: KeyCode.down, keyCode: KeyCode.right, isRtl: false, inverted: false },
    { enterKeyCode: KeyCode.down, keyCode: KeyCode.left, isRtl: true, inverted: false },
    { enterKeyCode: KeyCode.left, keyCode: KeyCode.down, isRtl: false, inverted: true },
    { enterKeyCode: KeyCode.right, keyCode: KeyCode.down, isRtl: true, inverted: true },
  ])(
    "moves focus to the next point in series, enterKeyCode=$enterKeyCode, keyCode=$keyCode, isRtl=$isRtl, inverted=$inverted",
    ({ enterKeyCode, keyCode, isRtl, inverted }) => {
      mockState.isRtl = isRtl;
      const { wrapper } = renderChart(commonProps(inverted));

      focusApplication();
      keyDown(KeyCode.enter);
      keyDown(enterKeyCode);
      keyDown(KeyCode.home);

      expect(describeFocusedElement()).toBe("button:1 11, Line series 1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 111Line series 221");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:2 12, Line series 1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("2Line series 112");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:3 13, Line series 1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("3Line series 113Line series 223");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:1 11, Line series 1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 111Line series 221");
    },
  );

  test.each([
    { enterKeyCode: KeyCode.up, keyCode: KeyCode.left, isRtl: false, inverted: false },
    { enterKeyCode: KeyCode.up, keyCode: KeyCode.right, isRtl: true, inverted: false },
    { enterKeyCode: KeyCode.right, keyCode: KeyCode.up, isRtl: false, inverted: true },
    { enterKeyCode: KeyCode.left, keyCode: KeyCode.up, isRtl: true, inverted: true },
  ])(
    "moves focus to the prev point in series, enterKeyCode=$enterKeyCode, keyCode=$keyCode, isRtl=$isRtl, inverted=$inverted",
    ({ enterKeyCode, keyCode, isRtl, inverted }) => {
      mockState.isRtl = isRtl;
      const { wrapper } = renderChart(commonProps(inverted));

      focusApplication();
      keyDown(KeyCode.enter);
      keyDown(enterKeyCode);
      keyDown(KeyCode.end);

      expect(describeFocusedElement()).toBe("button:4 24, Line series 2[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("4Line series 224");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:3 23, Line series 2[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("3Line series 113Line series 223");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:1 21, Line series 2[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 111Line series 221");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:4 24, Line series 2[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("4Line series 224");
    },
  );

  test.each([
    { enterKeyCode: KeyCode.down, keyCode: KeyCode.down, isRtl: "random" as const, inverted: false },
    { enterKeyCode: KeyCode.left, keyCode: KeyCode.left, isRtl: false, inverted: true },
    { enterKeyCode: KeyCode.right, keyCode: KeyCode.right, isRtl: true, inverted: true },
  ])(
    "moves focus to the next series, enterKeyCode=$enterKeyCode, keyCode=$keyCode, isRtl=$isRtl, inverted=$inverted",
    ({ enterKeyCode, keyCode, isRtl, inverted }) => {
      mockState.isRtl = isRtl;
      const { wrapper } = renderChart(commonProps(inverted, seriesShort3));

      focusApplication();
      keyDown(KeyCode.enter);
      keyDown(enterKeyCode);
      keyDown(KeyCode.home);

      expect(describeFocusedElement()).toBe("button:1 11, Line series 1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 111Line series 221Line series 331");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:1 21, Line series 2[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 111Line series 221Line series 331");

      keyDown(keyCode);
      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:1 11, Line series 1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 111Line series 221Line series 331");
    },
  );

  test.each([
    { enterKeyCode: KeyCode.up, keyCode: KeyCode.up, isRtl: "random" as const, inverted: false },
    { enterKeyCode: KeyCode.right, keyCode: KeyCode.right, isRtl: false, inverted: true },
    { enterKeyCode: KeyCode.left, keyCode: KeyCode.left, isRtl: true, inverted: true },
  ])(
    "moves focus to the prev series, enterKeyCode=$enterKeyCode, keyCode=$keyCode, isRtl=$isRtl, inverted=$inverted",
    ({ enterKeyCode, keyCode, isRtl, inverted }) => {
      mockState.isRtl = isRtl;
      const { wrapper } = renderChart(commonProps(inverted, seriesShort3));

      focusApplication();
      keyDown(KeyCode.enter);
      keyDown(enterKeyCode);
      keyDown(KeyCode.end);

      expect(describeFocusedElement()).toBe("button:2 32, Line series 3[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("2Line series 112Line series 222Line series 332");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:2 22, Line series 2[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("2Line series 112Line series 222Line series 332");

      keyDown(keyCode);
      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:2 32, Line series 3[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("2Line series 112Line series 222Line series 332");
    },
  );

  test.each([
    { enterKeyCode: KeyCode.down, keyCode: KeyCode.pageDown, isRtl: "random" as const, inverted: false },
    { enterKeyCode: KeyCode.left, keyCode: KeyCode.pageDown, isRtl: "random" as const, inverted: true },
  ])(
    "moves focus to the next page in series, enterKeyCode=$enterKeyCode, keyCode=$keyCode, isRtl=$isRtl, inverted=$inverted",
    ({ enterKeyCode, keyCode, isRtl, inverted }) => {
      mockState.isRtl = isRtl;
      const { wrapper } = renderChart(commonProps(inverted, seriesLong1));

      focusApplication();
      keyDown(KeyCode.enter);
      keyDown(enterKeyCode);
      keyDown(KeyCode.home);

      expect(describeFocusedElement()).toBe("button:1 -1, Line series 1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 1-1");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:51 -51, Line series 1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("51Line series 1-51");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:101 -101, Line series 1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("101Line series 1-101");

      range(20).forEach(() => keyDown(keyCode));

      expect(describeFocusedElement()).toBe("button:1K -1K, Line series 1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1KLine series 1-1K");
    },
  );

  test.each([
    { enterKeyCode: KeyCode.down, keyCode: KeyCode.pageUp, isRtl: "random" as const, inverted: false },
    { enterKeyCode: KeyCode.left, keyCode: KeyCode.pageUp, isRtl: "random" as const, inverted: true },
  ])(
    "moves focus to the prev page in series, enterKeyCode=$enterKeyCode, keyCode=$keyCode, isRtl=$isRtl, inverted=$inverted",
    ({ enterKeyCode, keyCode, isRtl, inverted }) => {
      mockState.isRtl = isRtl;
      const { wrapper } = renderChart(commonProps(inverted, seriesLong1));

      focusApplication();
      keyDown(KeyCode.enter);
      keyDown(enterKeyCode);
      keyDown(KeyCode.end);

      expect(describeFocusedElement()).toBe("button:1K -1K, Line series 1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1KLine series 1-1K");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:950 -950, Line series 1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("950Line series 1-950");

      keyDown(keyCode);

      expect(describeFocusedElement()).toBe("button:900 -900, Line series 1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("900Line series 1-900");

      range(20).forEach(() => keyDown(keyCode));

      expect(describeFocusedElement()).toBe("button:1 -1, Line series 1[true,false]");
      expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 1-1");
    },
  );

  test("moves focus from point to group", () => {
    const { wrapper } = renderChart(commonProps(false, seriesLong1));

    focusApplication();
    keyDown(KeyCode.enter);
    keyDown(KeyCode.down);

    expect(describeFocusedElement()).toBe("button:1 -1, Line series 1[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 1-1");

    keyDown(KeyCode.escape);

    expect(describeFocusedElement()).toBe("button:1[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 1-1");
  });

  test("pins popover at point", () => {
    const { wrapper } = renderChart(commonProps(false, seriesLong1));

    focusApplication();
    keyDown(KeyCode.enter);
    keyDown(KeyCode.down);

    expect(describeFocusedElement()).toBe("button:1 -1, Line series 1[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 1-1");
    expect(wrapper.findTooltip()!.findDismissButton()).toBe(null);

    keyDown(KeyCode.enter);

    expect(describeFocusedElement()).toBe("button:Unpin tooltip");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("1Line series 1-1");
    expect(wrapper.findTooltip()!.findDismissButton()).not.toBe(null);
  });

  test("formats accessible point description", () => {
    const { wrapper } = renderChart({
      ...commonProps(),
      options: {
        series: seriesShort2,
        xAxis: { title: { text: "X" }, valueFormatter: (value) => `x${value}` },
        yAxis: { title: { text: "Y" }, valueFormatter: (value) => `y${value}` },
      },
    });

    focusApplication();
    keyDown(KeyCode.home);

    expect(describeFocusedElement()).toBe("button:x1[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("x1Line series 1y11Line series 2y21");

    keyDown(KeyCode.down);

    expect(describeFocusedElement()).toBe("button:x1 y11, Line series 1[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("x1Line series 1y11Line series 2y21");
  });
});
