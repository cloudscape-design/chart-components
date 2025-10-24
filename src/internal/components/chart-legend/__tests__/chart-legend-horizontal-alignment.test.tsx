// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ChartLegend, ChartLegendProps } from "@lib/components/internal/components/chart-legend";
import { render } from "@testing-library/react";
import { vi } from "vitest";

import styles from "@lib/components/internal/components/chart-legend/styles.selectors.js";
import testClasses from "@lib/components/internal/components/chart-legend/test-classes/styles.selectors.js";

const defaultProps: ChartLegendProps = {
  items: [
    { id: "item1", name: "Item 1", visible: true, highlighted: false, marker: <div>•</div> },
    { id: "item2", name: "Item 2", visible: true, highlighted: false, marker: <div>•</div> },
  ],
  position: "bottom",
  horizontalAlignment: "start",
  onItemHighlightEnter: vi.fn(),
  onItemHighlightExit: vi.fn(),
  onItemVisibilityChange: vi.fn(),
  getTooltipContent: () => null,
};

describe("ChartLegend horizontalAlignment", () => {
  describe("when horizontalAlignment is 'start'", () => {
    test("applies correct CSS class to legend title", () => {
      const { container } = render(
        <ChartLegend {...defaultProps} legendTitle="Test Legend" horizontalAlignment="start" />,
      );

      const titleElement = container.querySelector(`.${testClasses.title}`);
      expect(titleElement).toHaveClass(styles["legend-title-start"]);
      expect(titleElement).not.toHaveClass(styles["legend-title-center"]);
    });

    test("applies correct CSS class to list element when position is bottom", () => {
      const { container } = render(<ChartLegend {...defaultProps} position="bottom" horizontalAlignment="start" />);

      const listElement = container.querySelector(`.${styles.list}`);
      expect(listElement).toHaveClass(styles["list-bottom-start"]);
      expect(listElement).not.toHaveClass(styles["list-bottom-center"]);
    });

    test("does not apply list-bottom alignment classes when position is side", () => {
      const { container } = render(<ChartLegend {...defaultProps} position="side" horizontalAlignment="start" />);

      const listElement = container.querySelector(`.${styles.list}`);
      expect(listElement).not.toHaveClass(styles["list-bottom-start"]);
      expect(listElement).not.toHaveClass(styles["list-bottom-center"]);
    });
  });

  describe("when horizontalAlignment is 'center'", () => {
    test("applies correct CSS class to legend title", () => {
      const { container } = render(
        <ChartLegend {...defaultProps} legendTitle="Test Legend" horizontalAlignment="center" />,
      );

      const titleElement = container.querySelector(`.${testClasses.title}`);
      expect(titleElement).toHaveClass(styles["legend-title-center"]);
      expect(titleElement).not.toHaveClass(styles["legend-title-start"]);
    });

    test("applies correct CSS class to list element when position is bottom", () => {
      const { container } = render(<ChartLegend {...defaultProps} position="bottom" horizontalAlignment="center" />);

      const listElement = container.querySelector(`.${styles.list}`);
      expect(listElement).toHaveClass(styles["list-bottom-center"]);
      expect(listElement).not.toHaveClass(styles["list-bottom-start"]);
    });

    test("does not apply list-bottom alignment classes when position is side", () => {
      const { container } = render(<ChartLegend {...defaultProps} position="side" horizontalAlignment="center" />);

      const listElement = container.querySelector(`.${styles.list}`);
      expect(listElement).not.toHaveClass(styles["list-bottom-start"]);
      expect(listElement).not.toHaveClass(styles["list-bottom-center"]);
    });
  });
});
