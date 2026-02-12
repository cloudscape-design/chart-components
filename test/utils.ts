// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BasePageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";

export function setupTest(url: string, test: (page: ChartPageObject) => Promise<void>) {
  return useBrowser({}, async (browser) => {
    await browser.url(url);
    const page = new ChartPageObject(browser);
    await page.waitForVisible("main");
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
