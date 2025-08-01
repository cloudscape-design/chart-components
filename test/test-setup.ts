// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { configure } from "@cloudscape-design/browser-test-tools/use-browser";

configure({
  browserName: "ChromeHeadlessIntegration",
  browserCreatorOptions: {
    seleniumUrl: `http://localhost:9515`,
  },
  webdriverOptions: {
    baseUrl: `http://localhost:4173`,
    implicitTimeout: 200,
  },
});
