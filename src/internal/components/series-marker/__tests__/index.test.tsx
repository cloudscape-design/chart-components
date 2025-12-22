// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ChartSeriesMarker } from "@lib/components/internal/components/series-marker";
import { ChartSeriesMarkerProps } from "@lib/components/internal/components/series-marker";
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

describe("ChartSeriesMarker", () => {
  const defaultProps = {
    type: "line",
    color: "#0073bb",
    markerAriaDescription: "This is a description",
  } satisfies ChartSeriesMarkerProps;

  describe("Warning SVG display", () => {
    test("does not render warning SVG when status is undefined", () => {
      const { container } = render(<ChartSeriesMarker {...defaultProps} />);
      const svgs = container.querySelector("path[data-testid='warning']");

      // Should only have one SVG (the marker itself)
      expect(svgs).toBeFalsy();
    });

    test("renders warning SVG when status is 'warning'", () => {
      const { container } = render(<ChartSeriesMarker {...defaultProps} status="warning" />);
      const svgs = container.querySelector("path[data-testid='warning']");

      // Should have two SVGs: marker + warning
      expect(svgs).toBeTruthy();
    });

    test("renders aria description when provided", () => {
      const { container } = render(<ChartSeriesMarker {...defaultProps} status="warning" />);
      const span = container.querySelector("span");

      expect(span!.textContent).toBe("This is a description");
    });
  });
});
