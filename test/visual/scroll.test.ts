// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";

import { setupScreenshotTest } from "../utils";

test(
  "scrolls highlighted element into view in tooltip and legend",
  setupScreenshotTest(
    "/#/01-cartesian-chart/many-series?screenshotMode=true&legendBottomMaxHeight=32",
    async (page) => {
      await page.waitForVisible(".screenshot-area");
      await page.waitForJsTimers(100);
      await page.hoverElement('[aria-label*="series 18"] [aria-label*="Sep 25\\a  01:15"]');
      const pngString = await page.fullPageScreenshot();
      expect(pngString).toMatchImageSnapshot();
    },
  ),
);
