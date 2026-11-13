// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";

import "@cloudscape-design/components/test-utils/selectors";
import "../../lib/components/test-utils/selectors";
import createWrapper from "../../lib/components/test-utils/selectors";
import CoreChartWrapper from "../../lib/components/test-utils/selectors/internal/core";
import { setupTest } from "../utils";

import coreTestClasses from "../../lib/components/core/test-classes/styles.selectors.js";
import legendTestClasses from "../../lib/components/internal/components/chart-legend/test-classes/styles.selectors.js";

const chart = createWrapper().findComponent(`.${coreTestClasses.root}`, CoreChartWrapper);
const tooltip = chart.findTooltip().toSelector();
const tooltipHeader = chart.findTooltip().findHeader().toSelector();
const dimmedLegendItems = `${chart.findLegend().toSelector()} .${legendTestClasses["dimmed-item"]}`;
const inactiveSeries = `${chart.toSelector()} .highcharts-series-inactive`;
const cursorMarkers = `${chart.toSelector()} .${coreTestClasses["highlight-marker"]}`;
const point = (series: number, index: number) =>
  `${chart.toSelector()} g.highcharts-markers.highcharts-series-${series} path.highcharts-point:nth-child(${index})`;
const legendItem = (index: number) => chart.findLegend().findItems().get(index).toSelector();

const pageUrl = (hoverDebounce: number) => `#/03-core/core-line-chart?hoverDebounce=${hoverDebounce}`;

type ChartPage = Parameters<Parameters<typeof setupTest>[1]>[0];

async function center(page: ChartPage, selector: string) {
  const box = await page.getBoundingBox(selector);
  return [box.left + box.width / 2, box.top + box.height / 2] as const;
}

test(
  "shows the cursor at once and the tooltip once the delay passes",
  setupTest(pageUrl(1000), async (page) => {
    const [x, y] = await center(page, point(0, 10));
    await page.moveCursorTo(x, y);

    await expect(page.getElementsCount(cursorMarkers)).resolves.toBeGreaterThan(0);
    await expect(page.isExisting(tooltip)).resolves.toBe(false);

    await page.waitForAssertion(() => expect(page.isExisting(tooltip)).resolves.toBe(true));
  }),
);

test(
  "keeps the current tooltip while the pointer moves to another point until it rests",
  setupTest(pageUrl(1000), async (page) => {
    const [ax, ay] = await center(page, point(0, 10));
    await page.moveCursorTo(ax, ay);
    await page.waitForAssertion(() => expect(page.isExisting(tooltip)).resolves.toBe(true));
    const [firstHeader] = await page.getElementsText(tooltipHeader);

    const [bx, by] = await center(page, point(1, 25));
    await page.moveCursorTo(bx, by);
    await expect(page.getElementsText(tooltipHeader)).resolves.toEqual([firstHeader]);

    await page.waitForAssertion(() => expect(page.getElementsText(tooltipHeader)).resolves.not.toEqual([firstHeader]));
  }),
);

test(
  "delays the series highlight when hovering a legend item",
  setupTest(pageUrl(1000), async (page) => {
    const [x, y] = await center(page, legendItem(1));
    await page.moveCursorTo(x, y);

    await expect(page.getElementsCount(dimmedLegendItems)).resolves.toBe(0);
    await expect(page.getElementsCount(inactiveSeries)).resolves.toBe(0);

    await page.waitForAssertion(() => expect(page.getElementsCount(dimmedLegendItems)).resolves.toBeGreaterThan(0));
    await expect(page.getElementsCount(inactiveSeries)).resolves.toBeGreaterThan(0);
  }),
);

test(
  "shows the tooltip immediately when the delay is 0",
  setupTest(pageUrl(0), async (page) => {
    const [x, y] = await center(page, point(0, 10));
    await page.moveCursorTo(x, y);

    await expect(page.isExisting(tooltip)).resolves.toBe(true);
  }),
);
