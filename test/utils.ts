// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BasePageObject, ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";

export function setupTest(url: string, test: (page: ChartPageObject) => Promise<void>) {
  return setupTestBase(ChartPageObject, url, test);
}

export function setupScreenshotTest(url: string, test: (page: ScreenshotPageObject) => Promise<void>) {
  return setupTestBase(ScreenshotPageObject, url, test);
}

function setupTestBase<P extends BasePageObject & { init?(): Promise<void> }>(
  PageClass: new (browser: WebdriverIO.Browser) => P,
  url: string,
  test: (page: P) => Promise<void>,
) {
  return useBrowser({}, async (browser) => {
    await browser.url(url);
    const page = new PageClass(browser);
    await page.waitForVisible("main");

    // Custom initialization.
    if (page.init) {
      await page.init();
    }

    await test(page);
  });
}

class ChartPageObject extends BasePageObject {
  async moveCursorTo(x: number, y: number) {
    await this.browser.performActions([
      {
        type: "pointer",
        id: "event",
        parameters: { pointerType: "mouse" },
        actions: [
          { type: "pointerMove", duration: 100, origin: "viewport", x, y },
          { type: "pause", duration: 150 },
        ],
      },
    ]);
  }

  async moveCursorBy(xOffset: number, yOffset: number) {
    await this.browser.performActions([
      {
        type: "pointer",
        id: "event",
        parameters: { pointerType: "mouse" },
        actions: [
          { type: "pointerMove", duration: 100, origin: "pointer", x: xOffset, y: yOffset },
          { type: "pause", duration: 150 },
        ],
      },
    ]);
  }

  async clickHere() {
    await this.browser.performActions([
      {
        type: "pointer",
        id: "event",
        parameters: { pointerType: "mouse" },
        actions: [
          { type: "pointerDown", origin: "pointer", button: 0, duration: 20 },
          { type: "pointerUp", origin: "pointer", button: 0, duration: 20 },
          { type: "pause", duration: 150 },
        ],
      },
    ]);
  }
}
