// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";

import "@cloudscape-design/components/test-utils/selectors";
import "../../lib/components/test-utils/selectors";
import createWrapper from "../../lib/components/test-utils/selectors";
import { setupTest } from "../utils";

const w = createWrapper();

test(
  "pins chart tooltip after hovering chart point and then chart point group",
  setupTest("#/01-cartesian-chart/column-chart-test", async (page) => {
    const chart = w.findCartesianHighcharts('[data-testid="grouped-column-chart"]');
    const point = chart.find('[aria-label="Jul 2019 6.32K, Prev costs"]');
    const expectedTooltipContent = ["Jul 2019\nCosts\n8.77K\nPrev costs\n6.32K"];

    const pointBox = await page.getBoundingBox(point.toSelector());
    const pointCenter = [pointBox.left + pointBox.width / 2, pointBox.top + pointBox.height / 2];

    // Hover on the 2nd point in group.
    await page.moveCursorTo(pointCenter[0], pointCenter[1]);
    await expect(page.getElementsText(chart.findTooltip().toSelector())).resolves.toEqual(expectedTooltipContent);
    await expect(page.isExisting(chart.findTooltip().findDismissButton().toSelector())).resolves.toBe(false);

    // Hover above the point (on the group).
    await page.moveCursorBy(0, -pointBox.height);
    await expect(page.getElementsText(chart.findTooltip().toSelector())).resolves.toEqual(expectedTooltipContent);
    await expect(page.isExisting(chart.findTooltip().findDismissButton().toSelector())).resolves.toBe(false);

    // Clicking on the group should pin the tooltip.
    await page.clickHere();
    await expect(page.getElementsText(chart.findTooltip().toSelector())).resolves.toEqual(expectedTooltipContent);
    await expect(page.isExisting(chart.findTooltip().findDismissButton().toSelector())).resolves.toBe(true);
  }),
);

// The unit tests emulate the pointer events of a drag, which cannot prove that a real browser produces
// the events the handlers rely on. This exercises the same interaction with an actual pointer.
test(
  "zooms into a range by dragging across the plot and resets it afterwards",
  setupTest("#/01-cartesian-chart/zoom", async (page) => {
    // The page collects a chart per zoom scenario, so the main demo is addressed by its test id.
    const chart = w.findCartesianHighcharts('[data-testid="zoom-chart"]');
    const xAxisLabels = chart.find(".highcharts-xaxis-labels").toSelector();

    const labelsBeforeZoom = await page.getText(xAxisLabels);
    await expect(page.isExisting(chart.findResetZoomButton().toSelector())).resolves.toBe(false);

    // Drag across the middle of the plot, from a quarter in to two thirds in.
    const plotBox = await page.getBoundingBox(chart.find(".highcharts-plot-background").toSelector());
    await page.moveCursorTo(plotBox.left + plotBox.width * 0.25, plotBox.top + plotBox.height / 2);
    await page.dragBy(Math.round(plotBox.width * 0.4), 0);

    // The zoom is applied, so the axis now shows a narrower range and can be reset.
    await page.waitForVisible(chart.findResetZoomButton().toSelector());
    await expect(page.getText(xAxisLabels)).resolves.not.toBe(labelsBeforeZoom);
    // Nothing of the selection is left drawn over the plot once the zoom is committed.
    await expect(page.isDisplayed(chart.findZoomCursor().toSelector())).resolves.toBe(false);

    await page.click(chart.findResetZoomButton().toSelector());
    await expect(page.getText(xAxisLabels)).resolves.toBe(labelsBeforeZoom);
    await expect(page.isExisting(chart.findResetZoomButton().toSelector())).resolves.toBe(false);
  }),
);
