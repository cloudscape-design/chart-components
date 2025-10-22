// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from "react";
import { waitFor } from "@testing-library/react";
import highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { vi } from "vitest";

import { circleIndex } from "@cloudscape-design/component-toolkit/internal";

import testClasses from "../../../lib/components/core/test-classes/styles.selectors";
import { objectContainingDeep, renderChart } from "./common";

vi.mock("highcharts-react-official", () => ({ __esModule: true, default: vi.fn(() => null) }));

// In chart container we use three container queries, that run in the following order: chart, header, footer.
let queryMeasurementIndex = 0;
const mockSizes = [100, 0, 20];

vi.mock("@cloudscape-design/component-toolkit/internal", async () => {
  const actual = await vi.importActual<typeof import("@cloudscape-design/component-toolkit/internal")>(
    "@cloudscape-design/component-toolkit/internal",
  );
  return {
    ...actual,
    useResizeObserver: (_, cb) => {
      const index = useRef(circleIndex(queryMeasurementIndex++, [0, 3])).current;
      useEffect(() => {
        cb({ contentBoxHeight: mockSizes[index] });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
    },
  };
});

const chartOptionsWithHeight = (height?: number | string) => objectContainingDeep({ options: { chart: { height } } });

describe("CoreChart: fit-size", () => {
  afterEach(() => {
    queryMeasurementIndex = 0;
    vi.resetAllMocks();
  });

  test("uses explicit chart height", () => {
    const { rerender } = renderChart({ highcharts });

    // Default height is used when explicit height is not set.
    expect(HighchartsReact).toHaveBeenCalledWith(chartOptionsWithHeight(400), expect.anything());

    rerender({ highcharts, options: { chart: { height: "20rem" } } });

    expect(HighchartsReact).toHaveBeenCalledWith(chartOptionsWithHeight("20rem"), expect.anything());

    rerender({
      highcharts,
      options: {},
      chartHeight: 444,
      verticalAxisTitlePlacement: "side",
    });

    expect(HighchartsReact).toHaveBeenCalledWith(chartOptionsWithHeight(444), expect.anything());

    rerender({
      highcharts,
      options: {},
      chartHeight: 444,
      chartMinHeight: 500,
      verticalAxisTitlePlacement: "side",
    });

    expect(HighchartsReact).toHaveBeenCalledWith(chartOptionsWithHeight(500), expect.anything());

    rerender({
      highcharts,
      options: {},
      chartHeight: 444,
      verticalAxisTitlePlacement: "top",
    });

    expect(HighchartsReact).toHaveBeenCalledWith(chartOptionsWithHeight(444 - 28), expect.anything());

    rerender({
      highcharts,
      options: {},
      chartHeight: 444,
      chartMinHeight: 500,
      verticalAxisTitlePlacement: "top",
    });

    expect(HighchartsReact).toHaveBeenCalledWith(chartOptionsWithHeight(500 - 28), expect.anything());
  });

  test("uses min chart height if provided height is less than that", () => {
    const { rerender } = renderChart({ highcharts, chartMinHeight: 500 });

    expect(HighchartsReact).toHaveBeenCalledWith(chartOptionsWithHeight(500), expect.anything());

    rerender({ highcharts, options: { chart: { height: "20rem" } } });

    expect(HighchartsReact).toHaveBeenCalledWith(chartOptionsWithHeight(500), expect.anything());

    rerender({ highcharts, options: { chart: { height: "20rem" } }, chartHeight: 444 });

    expect(HighchartsReact).toHaveBeenCalledWith(chartOptionsWithHeight(500), expect.anything());
  });

  test.each([{ verticalAxisTitlePlacement: "side" as const }, { verticalAxisTitlePlacement: "top" as const }])(
    "uses measured or min height when fitHeight=true, verticalAxisTitlePlacement=$verticalAxisTitlePlacement",
    async ({ verticalAxisTitlePlacement }) => {
      const offset = verticalAxisTitlePlacement === "top" ? 28 : 0;
      const { rerender } = renderChart({ highcharts, fitHeight: true, verticalAxisTitlePlacement });

      // Uses default min height of 200px.
      await waitFor(() => {
        expect(HighchartsReact).toHaveBeenCalledWith(chartOptionsWithHeight(200 - offset), expect.anything());
      });

      // Uses measured height when it is bigger than explicitly provided min height.
      rerender({ highcharts, fitHeight: true, chartMinHeight: 50, verticalAxisTitlePlacement });
      await waitFor(() => {
        expect(HighchartsReact).toHaveBeenCalledWith(chartOptionsWithHeight(80 - offset), expect.anything());
      });

      // Chart height has no effect on charts with fit-height.
      rerender({ highcharts, fitHeight: true, chartMinHeight: 50, chartHeight: 300, verticalAxisTitlePlacement });
      await waitFor(() => {
        expect(HighchartsReact).toHaveBeenCalledWith(chartOptionsWithHeight(80 - offset), expect.anything());
      });

      // Taking min height which is above the default min height.
      rerender({ highcharts, fitHeight: true, chartHeight: 300, chartMinHeight: 250, verticalAxisTitlePlacement });
      await waitFor(() => {
        expect(HighchartsReact).toHaveBeenCalledWith(chartOptionsWithHeight(250 - offset), expect.anything());
      });
    },
  );

  test.each([{ fitHeight: false }, { fitHeight: true }])("applies minWidth, fitHeight=$fitHeight", ({ fitHeight }) => {
    const { rerender, wrapper } = renderChart({ highcharts, fitHeight });

    expect(wrapper.findByClassName(testClasses["chart-plot-wrapper"])!.getElement().style.minInlineSize).toBe("");

    rerender({ highcharts, fitHeight, chartMinWidth: 333 });

    expect(wrapper.findByClassName(testClasses["chart-plot-wrapper"])!.getElement().style.minInlineSize).toBe("333px");
  });
});
