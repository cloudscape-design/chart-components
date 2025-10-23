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
