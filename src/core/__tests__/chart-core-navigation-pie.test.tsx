// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";
import { vi } from "vitest";

import { KeyCode } from "@cloudscape-design/component-toolkit/internal";

import "highcharts/modules/accessibility";
import { CoreChartProps } from "../../../lib/components/core/interfaces";
import { createChartWrapper, renderChart } from "./common";

const series: Highcharts.SeriesOptionsType[] = [
  {
    type: "pie",
    name: "Pie series",
    data: [
      { name: "P1", y: 10 },
      { name: "P2", y: 30 },
      { name: "P3", y: 60 },
    ],
  },
];
const commonProps: CoreChartProps = {
  highcharts,
  options: { series },
  ariaLabel: "Test chart",
  i18nStrings: { detailPopoverDismissAriaLabel: "Unpin tooltip" },
};

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

describe("CoreChart: navigation, pie charts", () => {
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
    const { wrapper } = renderChart(commonProps);

    focusApplication();

    expect(describeFocusedElement()).toBe("application:Test chart");
    expect(wrapper.findTooltip()).toBe(null);
  });

  test.each([
    { keyCode: KeyCode.space, isRtl: "random" as const },
    { keyCode: KeyCode.enter, isRtl: "random" as const },
    { keyCode: KeyCode.right, isRtl: false },
    { keyCode: KeyCode.left, isRtl: true },
    { keyCode: KeyCode.down, isRtl: "random" as const },
    { keyCode: KeyCode.home, isRtl: "random" as const },
  ])("moves focus to the first segment, keyCode=$keyCode, isRtl=$isRtl", ({ keyCode, isRtl }) => {
    mockState.isRtl = isRtl;
    const { wrapper } = renderChart(commonProps);

    focusApplication();
    keyDown(keyCode);

    expect(describeFocusedElement()).toBe("button:P1, 10. Pie series[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("P1Pie series10");
  });

  test.each([
    { keyCode: KeyCode.left, isRtl: false },
    { keyCode: KeyCode.right, isRtl: true },
    { keyCode: KeyCode.up, isRtl: "random" as const },
    { keyCode: KeyCode.end, isRtl: "random" as const },
  ])("moves focus to the last segment, keyCode=$keyCode, isRtl=$isRtl", ({ keyCode, isRtl }) => {
    mockState.isRtl = isRtl;
    const { wrapper } = renderChart(commonProps);

    focusApplication();
    keyDown(keyCode);

    expect(describeFocusedElement()).toBe("button:P3, 60. Pie series[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("P3Pie series60");
  });

  test.each([
    { keyCode: KeyCode.right, isRtl: false },
    { keyCode: KeyCode.right, isRtl: true },
  ])("moves focus to the next segment, keyCode=$keyCode, isRtl=$isRtl", ({ keyCode, isRtl }) => {
    mockState.isRtl = isRtl;
    const { wrapper } = renderChart(commonProps);

    focusApplication();
    keyDown(KeyCode.home);

    expect(describeFocusedElement()).toBe("button:P1, 10. Pie series[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("P1Pie series10");

    keyDown(keyCode);

    expect(describeFocusedElement()).toBe("button:P2, 30. Pie series[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("P2Pie series30");

    keyDown(keyCode);

    expect(describeFocusedElement()).toBe("button:P3, 60. Pie series[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("P3Pie series60");

    keyDown(keyCode);

    expect(describeFocusedElement()).toBe("button:P1, 10. Pie series[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("P1Pie series10");
  });

  test.each([
    { keyCode: KeyCode.left, isRtl: false },
    { keyCode: KeyCode.left, isRtl: true },
  ])("moves focus to the prev segment, keyCode=$keyCode, isRtl=$isRtl", ({ keyCode, isRtl }) => {
    mockState.isRtl = isRtl;
    const { wrapper } = renderChart(commonProps);

    focusApplication();
    keyDown(KeyCode.end);

    expect(describeFocusedElement()).toBe("button:P3, 60. Pie series[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("P3Pie series60");

    keyDown(keyCode);

    expect(describeFocusedElement()).toBe("button:P2, 30. Pie series[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("P2Pie series30");

    keyDown(keyCode);

    expect(describeFocusedElement()).toBe("button:P1, 10. Pie series[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("P1Pie series10");

    keyDown(keyCode);

    expect(describeFocusedElement()).toBe("button:P3, 60. Pie series[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("P3Pie series60");
  });

  test("moves focus from segment to chart", () => {
    const { wrapper } = renderChart(commonProps);

    focusApplication();
    keyDown(KeyCode.enter);

    expect(describeFocusedElement()).toBe("button:P1, 10. Pie series[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("P1Pie series10");

    keyDown(KeyCode.escape);

    expect(describeFocusedElement()).toBe("application:Test chart");
    expect(wrapper.findTooltip()).toBe(null);
  });

  test("pins popover at segment", () => {
    const { wrapper } = renderChart(commonProps);

    focusApplication();
    keyDown(KeyCode.enter);

    expect(describeFocusedElement()).toBe("button:P1, 10. Pie series[true,false]");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("P1Pie series10");
    expect(wrapper.findTooltip()!.findDismissButton()).toBe(null);

    keyDown(KeyCode.enter);

    expect(describeFocusedElement()).toBe("button:Unpin tooltip");
    expect(wrapper.findTooltip()!.getElement().textContent).toBe("P1Pie series10");
    expect(wrapper.findTooltip()!.findDismissButton()).not.toBe(null);
  });
});
