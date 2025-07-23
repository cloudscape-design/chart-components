// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";
import { vi } from "vitest";

import { createChartWrapper, renderChart } from "./common";

const series: Highcharts.SeriesOptionsType[] = [
  { type: "line", name: "L1", data: [1] },
  { type: "line", name: "L2", data: [2] },
];

const i18nProvider = {
  "[charts]": {
    "i18nStrings.filterLabel": "provider: filter label",
    "i18nStrings.filterPlaceholder": "provider: filter placeholder",
  },
};
const i18nStrings = {
  seriesFilterLabel: "i18n: filter label",
  seriesFilterPlaceholder: "i18n: filter placeholder",
};

describe("CoreChart: series filter", () => {
  test("render series filter with provider messages", () => {
    renderChart({
      highcharts,
      options: { series },
      filter: { seriesFilter: true },
      i18nProvider,
    });
    expect(createChartWrapper().findFilter()!.getElement().textContent).toBe(
      "provider: filter labelprovider: filter placeholder",
    );
  });

  test("render series filter with i18n messages", () => {
    renderChart({
      highcharts,
      options: { series },
      filter: { seriesFilter: true },
      i18nProvider,
      i18nStrings,
    });
    expect(createChartWrapper().findFilter()!.getElement().textContent).toBe(
      "i18n: filter labeli18n: filter placeholder",
    );
  });

  test("calls onVisibleItemsChange", () => {
    const onVisibleItemsChange = vi.fn();
    renderChart({
      highcharts,
      options: { series },
      filter: { seriesFilter: true },
      onVisibleItemsChange,
      visibleItems: ["L1", "L2"],
    });
    createChartWrapper().findFilter()!.findSeriesFilter()!.findMultiselect()!.openDropdown();
    createChartWrapper().findFilter()!.findSeriesFilter()!.findMultiselect()!.selectOption(1);
    expect(onVisibleItemsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: {
          items: [
            { id: "L1", name: "L1", marker: expect.anything(), visible: false, highlighted: false },
            { id: "L2", name: "L2", marker: expect.anything(), visible: true, highlighted: false },
          ],
          isApiCall: false,
        },
      }),
    );
  });
});
