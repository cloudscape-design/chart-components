// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { render, waitFor } from "@testing-library/react";
import Highcharts from "highcharts";

import "highcharts/modules/no-data-to-display";
import "@cloudscape-design/components/test-utils/dom";
import { CloudscapeHighcharts, CloudscapeHighchartsProps } from "../../../lib/components/core/chart-core";
import testClasses from "../../../lib/components/core/test-classes/styles.selectors";
import createWrapper, { ElementWrapper } from "../../../lib/components/test-utils/dom";

class TestWrapper extends ElementWrapper {
  findNoData = () => this.findByClassName(testClasses["no-data"]);
}

function renderChart(props: Partial<CloudscapeHighchartsProps>, Component = CloudscapeHighcharts) {
  render(<Component highcharts={Highcharts} className="test-chart" options={{}} {...props} />);
  const wrapper = new TestWrapper(createWrapper().findByClassName("test-chart")!.getElement());
  return wrapper;
}

const series: Highcharts.SeriesOptionsType[] = [{ type: "line", name: "Line series", data: [1, 2, 3] }];

const noDataContent = {
  loading: "no-data: loading",
  empty: "no-data: empty",
  noMatch: "no-data: no-match",
  error: "no-data: error",
};

describe("CloudscapeHighcharts: no-data", () => {
  test('does not render no-data when statusType="finished"', () => {
    const wrapper = renderChart({
      options: { series },
      noData: { statusType: "finished", ...noDataContent },
    });

    expect(wrapper.findNoData()).toBe(null);
  });

  test('renders no-data loading when statusType="loading"', async () => {
    const wrapper = renderChart({
      options: { series },
      noData: { statusType: "loading", ...noDataContent },
    });

    await waitFor(() => {
      expect(wrapper.findNoData()).not.toBe(null);
      expect(wrapper.findNoData()!.getElement().textContent).toBe("no-data: loading");
      expect(wrapper.findLiveRegion()!.getElement()).toHaveTextContent("no-data: loading");
    });
  });

  test('renders no-data loading when statusType="error"', async () => {
    const wrapper = renderChart({
      options: { series },
      noData: { statusType: "error", ...noDataContent },
    });

    await waitFor(() => {
      expect(wrapper.findNoData()).not.toBe(null);
      expect(wrapper.findNoData()!.getElement().textContent).toBe("no-data: error");
      expect(wrapper.findLiveRegion()!.getElement()).toHaveTextContent("no-data: error");
    });
  });

  test('renders no-data empty when statusType="finished" and no series provided', async () => {
    const wrapper = renderChart({
      options: { series: [] },
      noData: { statusType: "finished", ...noDataContent },
    });

    await waitFor(() => {
      expect(wrapper.findNoData()).not.toBe(null);
      expect(wrapper.findNoData()!.getElement().textContent).toBe("no-data: empty");
      expect(wrapper.findLiveRegion()).toBe(null);
    });
  });

  test('renders no-data no-match when statusType="finished" and no series visible', async () => {
    const wrapper = renderChart({
      options: { series },
      noData: { statusType: "finished", ...noDataContent },
      visibleSeries: [],
    });

    await waitFor(() => {
      expect(wrapper.findNoData()).not.toBe(null);
      expect(wrapper.findNoData()!.getElement().textContent).toBe("no-data: no-match");
      expect(wrapper.findLiveRegion()).toBe(null);
    });
  });
});
