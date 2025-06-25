// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import path from "path";
import { expect, test } from "vitest";

import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";

import { setupTest } from "../utils";

const pagesMap = import.meta.glob("../../pages/**/*.page.tsx", { as: "raw" });
const allPages = Object.keys(pagesMap)
  .map((page) => page.replace(/\.page\.tsx$/, ""))
  .map((page) => "/#/" + path.relative("../../pages/", page) + "?screenshotMode=true");

const rtlPages = allPages
  .filter((page) => page.includes("no-data-states") || page.includes("website-playground-examples"))
  .map((page) => page + "&direction=rtl");

test.each([...allPages, ...rtlPages])("matches snapshot for %s", (route) =>
  setupTest(route, ScreenshotPageObject, async (page) => {
    const hasScreenshotArea = await page.isExisting(".screenshot-area");
    if (hasScreenshotArea) {
      await page.waitForJsTimers(100);
      const pngString = await page.fullPageScreenshot();
      expect(pngString).toMatchImageSnapshot();
    }
  })(),
);
