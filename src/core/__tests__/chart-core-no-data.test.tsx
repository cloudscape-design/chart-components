// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";
import { vi } from "vitest";

import "highcharts/modules/no-data-to-display";
import createWrapper from "../../../lib/components/test-utils/dom";
import { createChartWrapper, renderChart } from "./common";

const series: Highcharts.SeriesOptionsType[] = [{ type: "line", name: "Line series", data: [1, 2, 3] }];

const i18nProvider = {
  "[charts]": {
    loadingText: "provider: loading",
    errorText: "provider: error",
    recoveryText: "provider: retry",
  },
};
const i18nStrings = {
  loadingText: "i18n: loading",
  errorText: "i18n: error",
  recoveryText: "i18n: retry",
};
const slots = {
  loading: "slot: loading",
  error: "slot: error",
  empty: "slot: empty",
  noMatch: "slot: no-match",
};

function getNoDataText(type: "empty" | "no-match" | "loading" | "error") {
  switch (type) {
    case "empty":
      return createChartWrapper().findNoData()!.findEmpty()!.getElement().textContent;
    case "no-match":
      return createChartWrapper().findNoData()!.findNoMatch()!.getElement().textContent;
    case "loading":
      return createChartWrapper().findNoData()!.findLoading()!.getElement().textContent;
    case "error":
      return createChartWrapper().findNoData()!.findError()!.getElement().textContent;
  }
}
function getNoDataLiveRegionText() {
  return createWrapper().findLiveRegion()!.getElement().textContent;
}

describe("CoreChart: no-data", () => {
  test('does not render no-data when statusType="finished" and data is present', () => {
    renderChart({
      highcharts,
      options: { series },
      noData: { statusType: "finished", ...slots },
      i18nStrings,
      i18nProvider,
    });
    expect(createChartWrapper().findNoData()).toBe(null);
  });

  test('renders no-data loading when statusType="loading" using provider i18n', async () => {
    renderChart({
      highcharts,
      options: { series: [] },
      noData: { statusType: "loading" },
      i18nProvider: i18nProvider,
    });
    await waitFor(() => {
      expect(getNoDataText("loading")).toBe("provider: loading");
      expect(getNoDataLiveRegionText()).toBe("provider: loading");
    });
  });

  test('renders no-data loading when statusType="loading" using i18n strings', async () => {
    renderChart({
      highcharts,
      options: { series: [] },
      noData: { statusType: "loading" },
      i18nStrings,
      i18nProvider,
    });

    await waitFor(() => {
      expect(getNoDataText("loading")).toBe("i18n: loading");
      expect(getNoDataLiveRegionText()).toBe("i18n: loading");
    });
  });

  test('renders no-data loading when statusType="loading" using loading slot', async () => {
    renderChart({
      highcharts,
      options: { series: [] },
      noData: { statusType: "loading", ...slots },
      i18nStrings,
      i18nProvider,
    });

    await waitFor(() => {
      expect(getNoDataText("loading")).toBe("slot: loading");
      expect(getNoDataLiveRegionText()).toBe("slot: loading");
    });
  });

  test('renders no-data error when statusType="error" using provider i18n', async () => {
    const { rerender } = renderChart({
      highcharts,
      options: { series: [] },
      noData: { statusType: "error" },
      i18nProvider,
    });
    await waitFor(() => {
      expect(getNoDataText("error")).toBe("provider: error");
      expect(getNoDataLiveRegionText()).toBe("provider: error");
    });

    const onRecoveryClick = vi.fn();
    rerender({
      highcharts,
      options: { series: [] },
      noData: { statusType: "error", onRecoveryClick },
      i18nProvider,
    });
    await waitFor(() => {
      expect(getNoDataText("error")).toBe(["provider: error", "provider: retry"].join(""));
      expect(getNoDataLiveRegionText()).toBe(["provider: error", "provider: retry"].join(""));
    });

    createWrapper().findButton()!.click();
    expect(onRecoveryClick).toHaveBeenCalled();
  });

  test('renders no-data error when statusType="error" using i18n strings', async () => {
    const { rerender } = renderChart({
      highcharts,
      options: { series: [] },
      noData: { statusType: "error" },
      i18nStrings,
      i18nProvider,
    });
    await waitFor(() => {
      expect(getNoDataText("error")).toBe("i18n: error");
      expect(getNoDataLiveRegionText()).toBe("i18n: error");
    });

    const onRecoveryClick = vi.fn();
    rerender({
      highcharts,
      options: { series: [] },
      noData: { statusType: "error", onRecoveryClick },
      i18nStrings,
      i18nProvider,
    });
    await waitFor(() => {
      expect(getNoDataText("error")).toBe(["i18n: error", "i18n: retry"].join(""));
      expect(getNoDataLiveRegionText()).toBe(["i18n: error", "i18n: retry"].join(""));
    });

    createWrapper().findButton()!.click();
    expect(onRecoveryClick).toHaveBeenCalled();
  });

  test('renders no-data error when statusType="error" using error slot', async () => {
    renderChart({
      highcharts,
      options: { series: [] },
      noData: { statusType: "error", ...slots },
      i18nStrings,
      i18nProvider,
    });
    await waitFor(() => {
      expect(getNoDataText("error")).toBe("slot: error");
      expect(getNoDataLiveRegionText()).toBe("slot: error");
    });
  });

  test('renders no-data empty when statusType="finished" and no series provided', async () => {
    renderChart({
      highcharts,
      options: { series: [] },
      noData: { statusType: "finished", ...slots },
    });
    await waitFor(() => {
      expect(getNoDataText("empty")).toBe("slot: empty");
      expect(getNoDataLiveRegionText()).toBe("slot: empty");
    });
  });

  test('does not render no-data empty when statusType="finished" and no series provided when empty is null', async () => {
    renderChart({
      highcharts,
      options: { series: [] },
      noData: { statusType: "finished", ...slots, empty: null },
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(createChartWrapper().findNoData()).toBe(null);
  });

  test.each(["line", "pie"] as const)(
    'renders no-data empty when statusType="finished" and no series data provided, series type = %s',
    async (seriesType) => {
      renderChart({
        highcharts,
        options: { series: [{ type: seriesType, name: "Empty data series", data: [] }] },
        noData: { statusType: "finished", ...slots },
      });
      await waitFor(() => {
        expect(getNoDataText("empty")).toBe("slot: empty");
        expect(getNoDataLiveRegionText()).toBe("slot: empty");
      });
    },
  );

  test('renders no-data no-match when statusType="finished" and no series visible', async () => {
    renderChart({
      highcharts,
      options: { series },
      noData: { statusType: "finished", ...slots },
      visibleItems: [],
    });
    await waitFor(() => {
      expect(getNoDataText("no-match")).toBe("slot: no-match");
      expect(getNoDataLiveRegionText()).toBe("slot: no-match");
    });
  });

  test('does not render no-data no-match when statusType="finished" and no series visible when noMatch is null', async () => {
    renderChart({
      highcharts,
      options: { series },
      noData: { statusType: "finished", ...slots, noMatch: null },
      visibleItems: [],
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(createChartWrapper().findNoData()).toBe(null);
  });
});
