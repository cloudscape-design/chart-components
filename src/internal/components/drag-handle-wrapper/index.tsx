// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

import { nodeContains } from "@cloudscape-design/component-toolkit/dom";
import { getLogicalBoundingClientRect } from "@cloudscape-design/component-toolkit/internal";

import DirectionButton from "./direction-button";
import { Direction, DragHandleWrapperProps } from "./interfaces";
import PortalOverlay from "./portal-overlay";

import styles from "./styles.css.js";
import testUtilsStyles from "./test-classes/styles.css.js";

// The UAP buttons are forced to top/bottom position if the handle is close to the screen edge.
const FORCED_POSITION_PROXIMITY_PX = 50;
// Approximate UAP button size with margins to decide forced direction.
const UAP_BUTTON_SIZE_PX = 40;
const DIRECTIONS_ORDER: Direction[] = ["block-end", "block-start", "inline-end", "inline-start"];

export default function DragHandleWrapper({
  directions,
  children,
  onDirectionClick,
  triggerMode = "focus",
  initialShowButtons = false,
  controlledShowButtons = false,
  wrapperClassName,
  hideButtonsOnDrag,
  clickDragThreshold,
}: DragHandleWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLDivElement | null>(null);
  const [uncontrolledShowButtons, setUncontrolledShowButtons] = useState(initialShowButtons);

  const isPointerDown = useRef(false);
  const initialPointerPosition = useRef<{ x: number; y: number } | undefined>();
  const didPointerDrag = useRef(false);

  const isDisabled =
    !directions["block-start"] && !directions["block-end"] && !directions["inline-start"] && !directions["inline-end"];

  const onWrapperFocusIn: React.FocusEventHandler = (event) => {
    if (document.body.dataset.awsuiFocusVisible && !nodeContains(wrapperRef.current, event.relatedTarget)) {
      if (triggerMode === "focus") {
        setUncontrolledShowButtons(true);
      }
    }
  };

  const onWrapperFocusOut: React.FocusEventHandler = (event) => {
    if (document.hasFocus() && !nodeContains(wrapperRef.current, event.relatedTarget)) {
      setUncontrolledShowButtons(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    document.addEventListener(
      "pointermove",
      (event) => {
        if (
          isPointerDown.current &&
          initialPointerPosition.current &&
          (event.clientX > initialPointerPosition.current.x + clickDragThreshold ||
            event.clientX < initialPointerPosition.current.x - clickDragThreshold ||
            event.clientY > initialPointerPosition.current.y + clickDragThreshold ||
            event.clientY < initialPointerPosition.current.y - clickDragThreshold)
        ) {
          didPointerDrag.current = true;
          if (hideButtonsOnDrag) {
            setUncontrolledShowButtons(false);
          }
        }
      },
      { signal: controller.signal },
    );

    const resetPointerDownState = () => {
      isPointerDown.current = false;
      initialPointerPosition.current = undefined;
    };

    document.addEventListener("pointercancel", resetPointerDownState, { signal: controller.signal });

    document.addEventListener(
      "pointerup",
      () => {
        if (isPointerDown.current && !didPointerDrag.current) {
          setUncontrolledShowButtons(true);
        }
        resetPointerDownState();
      },
      { signal: controller.signal },
    );

    return () => controller.abort();
  }, [clickDragThreshold, hideButtonsOnDrag]);

  const onHandlePointerDown: React.PointerEventHandler = (event) => {
    isPointerDown.current = true;
    didPointerDrag.current = false;
    initialPointerPosition.current = { x: event.clientX, y: event.clientY };
  };

  const onDragHandleKeyDown: React.KeyboardEventHandler = (event) => {
    if (event.key === "Escape") {
      setUncontrolledShowButtons(false);
    } else if (triggerMode === "keyboard-activate" && (event.key === "Enter" || event.key === " ")) {
      setUncontrolledShowButtons((prev) => !prev);
    } else if (
      event.key !== "Alt" &&
      event.key !== "Control" &&
      event.key !== "Meta" &&
      event.key !== "Shift" &&
      triggerMode === "focus"
    ) {
      setUncontrolledShowButtons(true);
    }
  };

  const showButtons = triggerMode === "controlled" ? controlledShowButtons : uncontrolledShowButtons;

  const [forcedPosition, setForcedPosition] = useState<null | "top" | "bottom">(null);
  const directionsOrder = forcedPosition === "bottom" ? [...DIRECTIONS_ORDER].reverse() : DIRECTIONS_ORDER;
  const visibleDirections = directionsOrder.filter((dir) => directions[dir]);

  useEffect(() => {
    if (!showButtons || !dragHandleRef.current) {
      if (forcedPosition !== null) {
        setForcedPosition(null);
      }
      return;
    }

    let frameId: number;

    const checkPosition = () => {
      if (!dragHandleRef.current) {
        return;
      }
      const rect = getLogicalBoundingClientRect(dragHandleRef.current);
      const conflicts = {
        "block-start": rect.insetBlockStart < FORCED_POSITION_PROXIMITY_PX,
        "block-end": window.innerHeight - rect.insetBlockEnd < FORCED_POSITION_PROXIMITY_PX,
        "inline-start": rect.insetInlineStart < FORCED_POSITION_PROXIMITY_PX,
        "inline-end": window.innerWidth - rect.insetInlineEnd < FORCED_POSITION_PROXIMITY_PX,
      };
      if (visibleDirections.some((direction) => conflicts[direction])) {
        const hasEnoughSpaceAbove = rect.insetBlockStart > visibleDirections.length * UAP_BUTTON_SIZE_PX;
        setForcedPosition(hasEnoughSpaceAbove ? "top" : "bottom");
      } else {
        setForcedPosition(null);
      }
      frameId = requestAnimationFrame(checkPosition);
    };

    frameId = requestAnimationFrame(checkPosition);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [forcedPosition, showButtons, visibleDirections]);

  return (
    <>
      <div
        className={clsx(testUtilsStyles.root, styles.contents)}
        ref={wrapperRef}
        onFocus={onWrapperFocusIn}
        onBlur={onWrapperFocusOut}
      >
        <div className={styles.contents}>
          <div
            className={clsx(styles["drag-handle"], wrapperClassName)}
            ref={dragHandleRef}
            onPointerDown={onHandlePointerDown}
            onKeyDown={onDragHandleKeyDown}
          >
            {children}
          </div>
        </div>
      </div>

      <PortalOverlay track={dragHandleRef} isDisabled={!showButtons}>
        {visibleDirections.map(
          (direction, index) =>
            directions[direction] && (
              <DirectionButton
                key={direction}
                show={!isDisabled && showButtons}
                direction={direction}
                state={directions[direction]}
                onClick={() => onDirectionClick?.(direction)}
                forcedPosition={forcedPosition}
                forcedIndex={index}
              />
            ),
        )}
      </PortalOverlay>
    </>
  );
}
