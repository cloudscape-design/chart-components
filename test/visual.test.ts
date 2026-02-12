// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import path from "path";
import { expect, test } from "vitest";

import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";

interface Scenario {
  desc: string;
  url: string;
  init?: (page: ScreenshotPageObject) => Promise<void>;
}

function pageUrl(page: string, params?: Record<string, string>) {
  const urlParams = new URLSearchParams({ screenshotMode: "true", ...params });
  return `/#${page}?${urlParams.toString()}`;
}

const ignoredPages = new Set([
  "/03-core/debugger-module",
  "/03-core/simple-zooming",
  "/03-core/in-iframe",
  "/06-visual-tests/in-iframe",
]);
const pagesMap = import.meta.glob("../pages/**/*.page.tsx", { as: "raw" });
const allStaticPages = Object.keys(pagesMap)
  .map((page) => page.replace(/\.page\.tsx$/, ""))
  .map((page) => "/" + path.relative("../pages/", page))
  .filter((page) => !ignoredPages.has(page));

const rtlStaticPages = [
  "/01-cartesian-chart/no-data-states",
  "/02-pie-chart/no-data-states",
  "/05-demos/website-playground-examples",
];

function setupScreenshotTest(url: string, test: (page: ScreenshotPageObject) => Promise<void>) {
  return useBrowser(async (browser) => {
    await browser.url(url);
    const page = new ScreenshotPageObject(browser);
    await page.waitForVisible(".screenshot-area");
    await page.waitForJsTimers(499);
    await test(page);
  });
}

const scenarios: Scenario[] = [
  ...allStaticPages.map((page) => ({ desc: `${page}-static-ltr`, url: pageUrl(page) })),
  ...rtlStaticPages.map((page) => ({ desc: `${page}-static-rtl`, url: pageUrl(page, { direction: "rtl" }) })),
  {
    desc: "dynamic/scrolls highlighted item into view in tooltip and legend",
    url: pageUrl("/01-cartesian-chart/many-series", { legendBottomMaxHeight: "32" }),
    init: (page) => page.hoverElement('[aria-label*="series 18"] [aria-label*="Sep 25\\a  01:15"]'),
  },
];

for (const { desc, url, init } of scenarios) {
  test(
    `${desc}`,
    setupScreenshotTest(url, async (page) => {
      await init?.(page);
      const pngString = await page.fullPageScreenshot();
      expect(pngString).toMatchImageSnapshot();
    }),
  );
}
