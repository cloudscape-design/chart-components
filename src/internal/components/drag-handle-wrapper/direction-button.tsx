// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useRef } from "react";
import clsx from "clsx";

import Icon, { IconProps } from "@cloudscape-design/components/icon";

import { Direction, DirectionState } from "./interfaces";

import styles from "./styles.css.js";
import testUtilsStyles from "./test-classes/styles.css.js";

// Minimal Transition wrapper — just shows/hides without animation.
function Transition({
  in: isIn,
  children,
}: {
  in: boolean;
  children: (state: string, ref: React.Ref<HTMLElement>) => React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  if (!isIn) {
    return <>{children("exited", ref)}</>;
  }
  return <>{children("entered", ref)}</>;
}

// Mapping from CSS logical property direction to icon name. The icon component
// already flips the left/right icons automatically based on RTL, so we don't
// need to do anything special.
const ICON_LOGICAL_PROPERTY_MAP: Record<Direction, IconProps.Name> = {
  "block-start": "arrow-up",
  "block-end": "arrow-down",
  "inline-start": "arrow-left",
  "inline-end": "arrow-right",
};

interface DirectionButtonProps {
  direction: Direction;
  state: DirectionState;
  onClick: React.MouseEventHandler;
  show: boolean;
  forcedPosition: null | "top" | "bottom";
  forcedIndex: number;
  ariaLabel?: string;
}

export default function DirectionButton({
  direction,
  state,
  show,
  onClick,
  forcedPosition,
  forcedIndex,
  ariaLabel,
}: DirectionButtonProps) {
  return (
    <Transition in={show}>
      {(transitionState, ref) => (
        <span
          ref={ref}
          className={clsx(
            styles["direction-button-wrapper"],
            !forcedPosition && styles[`direction-button-wrapper-${direction}`],
            forcedPosition && styles["direction-button-wrapper-forced"],
            forcedPosition && styles[`direction-button-wrapper-forced-${forcedPosition}-${forcedIndex}`],
            transitionState === "exited" && styles["direction-button-wrapper-hidden"],
            styles[`direction-button-wrapper-motion-${transitionState}`],
          )}
        >
          <button
            type="button"
            aria-label={ariaLabel}
            disabled={state === "disabled"}
            className={clsx(
              styles["direction-button"],
              state === "disabled" && styles["direction-button-disabled"],
              testUtilsStyles[`direction-button-${direction}`],
              !["exiting", "exited"].includes(transitionState) && testUtilsStyles["direction-button-visible"],
            )}
            onClick={state !== "disabled" ? onClick : undefined}
            onPointerDown={(event) => event.preventDefault()}
          >
            <Icon name={ICON_LOGICAL_PROPERTY_MAP[direction]} size="small" />
          </button>
        </span>
      )}
    </Transition>
  );
}
