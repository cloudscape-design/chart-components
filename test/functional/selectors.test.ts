// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";

import { BasePageObject } from "@cloudscape-design/browser-test-tools/page-objects";

import "@cloudscape-design/components/test-utils/selectors";
import "../../lib/components/test-utils/selectors";
import createWrapper from "../../lib/components/test-utils/selectors";
import { setupTest } from "../utils";

const w = createWrapper();

test(
  "root selectors",
  setupTest("#/05-demos/website-playground-examples", BasePageObject, async (page) => {
    await expect(page.getElementsCount(w.findCartesianHighcharts().toSelector())).resolves.toBe(11);
    await expect(page.getElementsCount(w.findAllCartesianHighcharts().toSelector())).resolves.toBe(11);
    await expect(page.getElementsCount(w.findAllCartesianHighcharts().get(1).toSelector())).resolves.toBe(11);
    await expect(page.getElementsCount(w.findPieHighcharts().toSelector())).resolves.toBe(3);
    await expect(page.getElementsCount(w.findAllPieHighcharts().toSelector())).resolves.toBe(3);
    await expect(page.getElementsCount(w.findAllPieHighcharts().get(1).toSelector())).resolves.toBe(3);
  }),
);
