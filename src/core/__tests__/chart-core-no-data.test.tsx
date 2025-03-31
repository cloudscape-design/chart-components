// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";

import "highcharts/modules/no-data-to-display";
import createWrapper from "../../../lib/components/test-utils/dom";
import { renderChart } from "./common";

const series: Highcharts.SeriesOptionsType[] = [{ type: "line", name: "Line series", data: [1, 2, 3] }];

const noDataContent = {
  loading: "no-data: loading",
  empty: "no-data: empty",
  noMatch: "no-data: no-match",
  error: "no-data: error",
};

describe("CloudscapeHighcharts: no-data", () => {
  test('does not render no-data when statusType="finished"', () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { series },
      noData: { statusType: "finished", ...noDataContent },
    });

    expect(wrapper.findNoData()).toBe(null);
  });

  test('renders no-data loading when statusType="loading"', async () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { series: [] },
      noData: { statusType: "loading", ...noDataContent },
    });

    await waitFor(() => {
      expect(wrapper.findNoData()).not.toBe(null);
      expect(wrapper.findNoData()!.getElement().textContent).toBe("no-data: loading");
      expect(createWrapper().findLiveRegion()!.getElement()).toHaveTextContent("no-data: loading");
    });
  });

  test('renders no-data error when statusType="error"', async () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { series: [] },
      noData: { statusType: "error", ...noDataContent },
    });

    await waitFor(() => {
      expect(wrapper.findNoData()).not.toBe(null);
      expect(wrapper.findNoData()!.getElement().textContent).toBe("no-data: error");
      expect(createWrapper().findLiveRegion()!.getElement()).toHaveTextContent("no-data: error");
    });
  });

  test('renders no-data empty when statusType="finished" and no series provided', async () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { series: [] },
      noData: { statusType: "finished", ...noDataContent },
    });

    await waitFor(() => {
      expect(wrapper.findNoData()).not.toBe(null);
      expect(wrapper.findNoData()!.getElement().textContent).toBe("no-data: empty");
      expect(createWrapper().findLiveRegion()).toBe(null);
    });
  });

  test.each(["line", "pie"] as const)(
    'renders no-data empty when statusType="finished" and no series data provided, series type = %s',
    async (seriesType) => {
      const { wrapper } = renderChart({
        highcharts,
        options: { series: [{ type: seriesType, name: "Empty data series", data: [] }] },
        noData: { statusType: "finished", ...noDataContent },
      });

      await waitFor(() => {
        expect(wrapper.findNoData()).not.toBe(null);
        expect(wrapper.findNoData()!.getElement().textContent).toBe("no-data: empty");
        expect(createWrapper().findLiveRegion()).toBe(null);
      });
    },
  );

  test('renders no-data no-match when statusType="finished" and no series visible', async () => {
    const { wrapper } = renderChart({
      highcharts,
      options: { series },
      noData: { statusType: "finished", ...noDataContent },
      hiddenItems: ["Line series"],
    });

    await waitFor(() => {
      expect(wrapper.findNoData()).not.toBe(null);
      expect(wrapper.findNoData()!.getElement().textContent).toBe("no-data: no-match");
      expect(createWrapper().findLiveRegion()).toBe(null);
    });
  });
});
