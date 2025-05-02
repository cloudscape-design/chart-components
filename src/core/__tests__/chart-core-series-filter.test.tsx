// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import highcharts from "highcharts";
import { vi } from "vitest";

import "highcharts/modules/no-data-to-display";
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

  test("calls onItemVisibilityChange", () => {
    const onItemVisibilityChange = vi.fn();
    renderChart({
      highcharts,
      options: { series },
      filter: { seriesFilter: true },
      onItemVisibilityChange,
    });
    createChartWrapper().findFilter()!.findSeriesFilter()!.findMultiselect()!.openDropdown();
    createChartWrapper().findFilter()!.findSeriesFilter()!.findMultiselect()!.selectOption(1);
    expect(onItemVisibilityChange).toHaveBeenCalledWith(["L1"]);
  });
});
