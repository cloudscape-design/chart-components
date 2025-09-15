// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";

import createWrapper from "@cloudscape-design/components/test-utils/selectors";

import "../../lib/components/test-utils/selectors";
import { setupTest } from "../utils";

const wrapper = createWrapper();

test(
  "index page",
  setupTest("#", async (page) => {
    await expect(page.getText("h1")).resolves.toBe("Welcome!");
    await expect(page.getElementsCount(wrapper.findLink().toSelector())).resolves.toBeGreaterThan(5);
  }),
);
