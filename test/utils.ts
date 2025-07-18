// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BasePageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";

export function setupTest<P extends BasePageObject & { init?(): Promise<void> }>(
  url: string,
  PageClass: new (browser: WebdriverIO.Browser) => P,
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
