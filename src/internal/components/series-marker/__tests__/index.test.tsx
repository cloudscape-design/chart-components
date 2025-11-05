// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ComponentProps } from "react";
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { ChartSeriesMarker } from "..";

describe("ChartSeriesMarker", () => {
  const defaultProps = {
    type: "line",
    color: "#0073bb",
  } satisfies ComponentProps<typeof ChartSeriesMarker>;

  describe("Warning SVG display", () => {
    test("does not render warning SVG when status is undefined", () => {
      const { container } = render(<ChartSeriesMarker {...defaultProps} />);
      const svgs = container.querySelectorAll("svg");

      // Should only have one SVG (the marker itself)
      expect(svgs).toHaveLength(1);
    });

    test("renders warning SVG when status is 'warning'", () => {
      const { container } = render(<ChartSeriesMarker {...defaultProps} status="warning" />);
      const svgs = container.querySelectorAll("svg");

      // Should have two SVGs: marker + warning
      expect(svgs).toHaveLength(2);
    });
  });
});
