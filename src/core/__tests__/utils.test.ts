// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { fillDefaultsForGetItemProps } from "../utils";

describe("fillDefaultsForGetItemProps", () => {
  describe.each([
    {
      scenario: "getItemProps is undefined",
      getItemProps: undefined,
      id: "item1",
      expected: { status: "default" },
    },
    {
      scenario: "getItemProps returns undefined",
      getItemProps: () => undefined,
      id: "item1",
      expected: { status: "default" },
    },
    {
      scenario: "getItemProps returns empty object",
      getItemProps: () => ({}),
      id: "item1",
      expected: { status: "default" },
    },
    {
      scenario: "getItemProps returns status",
      getItemProps: () => ({ status: "active" as const }),
      id: "item1",
      expected: { status: "active" },
    },
  ])("$scenario", ({ getItemProps, id, expected }) => {
    it("should return correct default values", () => {
      const result = fillDefaultsForGetItemProps(getItemProps);
      expect(result(id)).toEqual(expected);
    });
  });
});
