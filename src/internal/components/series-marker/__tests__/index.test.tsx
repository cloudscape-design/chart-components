// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ComponentProps } from "react";
import { ChartSeriesMarker } from "@lib/components/internal/components/series-marker";
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

describe("ChartSeriesMarker", () => {
  const defaultProps = {
    type: "line",
    color: "#0073bb",
    i18nStrings: {
      seriesStatusWarningAriaLabel: "warning",
    },
  } satisfies ComponentProps<typeof ChartSeriesMarker>;

  describe("Warning SVG display", () => {
    test("does not render warning SVG when status is undefined", () => {
      const { container } = render(<ChartSeriesMarker {...defaultProps} />);
      const svgs = container.querySelector("path[aria-label='warning']");

      // Should only have one SVG (the marker itself)
      expect(svgs).toBeFalsy();
    });

    test("renders warning SVG when status is 'warning'", () => {
      const { container } = render(<ChartSeriesMarker {...defaultProps} status="warning" />);
      const svgs = container.querySelector("path[aria-label='warning']");

      // Should have two SVGs: marker + warning
      expect(svgs).toBeTruthy();
    });
  });
});
