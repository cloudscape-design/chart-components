// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// type-only import, because in runtime it tries to access Jest globals, which do not exist
/// <reference types="@testing-library/jest-dom" />
import matchers from "@testing-library/jest-dom/matchers";
import { expect, vi } from "vitest";

// Resolves https://github.com/highcharts/highcharts/issues/22910
vi.stubGlobal("CSS", {
  supports: vi.fn().mockImplementation(() => {
    return true;
  }),
});

expect.extend(matchers);
