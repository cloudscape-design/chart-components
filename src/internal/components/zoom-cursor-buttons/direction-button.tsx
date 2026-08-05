// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";

import Icon, { IconProps } from "@cloudscape-design/components/icon";

import styles from "./styles.css.js";
import testUtilsStyles from "./test-classes/styles.css.js";

// Adapted from the drag handle direction buttons in @cloudscape-design/components
// (src/internal/components/drag-handle-wrapper). That component is not exported from the package, so
// the parts needed to move the zoom cursor are reproduced here, reduced to the inline directions and
// without the drag-handle behaviours (pointer tracking, tooltips, viewport-edge repositioning).
export type Direction = "inline-start" | "inline-end";

// The icon component flips the left/right icons in right-to-left rendering, so each logical direction
// maps to a single icon name.
const DIRECTION_ICONS: Record<Direction, IconProps.Name> = {
  "inline-start": "arrow-left",
  "inline-end": "arrow-right",
};

interface DirectionButtonProps {
  direction: Direction;
  ariaLabel: string;
  disabled?: boolean;
  onClick: React.MouseEventHandler;
}

export default function DirectionButton({ direction, ariaLabel, disabled, onClick }: DirectionButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      className={clsx(
        styles["direction-button"],
        styles[`direction-button-${direction}`],
        disabled && styles["direction-button-disabled"],
        testUtilsStyles["direction-button"],
        testUtilsStyles[`direction-button-${direction}`],
      )}
      onClick={onClick}
      // Keep the press from moving focus off the chart, which would end the zoom interaction.
      onPointerDown={(event) => event.preventDefault()}
    >
      <Icon name={DIRECTION_ICONS[direction]} size="small" />
    </button>
  );
}
