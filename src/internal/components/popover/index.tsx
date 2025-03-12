// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useEffect, useRef } from "react";
import clsx from "clsx";

import { nodeBelongs, nodeContains } from "@cloudscape-design/component-toolkit/dom";
import { PopoverProps } from "@cloudscape-design/components/popover/interfaces";

import { useMergeRefs } from "../../utils/use-merge-refs";
import PopoverBody from "../popover/body";
import PopoverContainer from "../popover/container";

import popoverStyles from "../popover/styles.css.js";
import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

interface ChartPopoverProps {
  size?: PopoverProps.Size | "content";
  position?: PopoverProps.Position;
  fixedWidth?: boolean;
  dismissButton?: boolean;
  dismissAriaLabel?: string;

  /** Title of the popover */
  header?: React.ReactNode;

  /** References the element the container is positioned against. */
  getTrack: () => null | HTMLElement | SVGElement;

  /** Used to update the container position in case track or track position changes. */
  trackKey?: string | number;

  /** Optional container element that prevents any clicks in there from dismissing the popover */
  container: Element | null;

  /** Event that is fired when the popover is dismissed */
  onDismiss: (outsideClick: boolean) => void;

  /** Fired when the pointer enters the hover-able area around the popover */
  onMouseEnter?: (event: React.MouseEvent) => void;

  /** Fired when the pointer leaves the hover-able area around the popover */
  onMouseLeave?: (event: React.MouseEvent) => void;

  onBlur?: (event: React.FocusEvent) => void;

  /** Popover content */
  children?: React.ReactNode;

  footer?: React.ReactNode;

  className?: string;
}

export default forwardRef(ChartPopover);

function ChartPopover(
  {
    position = "right",
    size = "medium",
    fixedWidth = false,
    dismissButton = false,
    dismissAriaLabel,

    children,
    footer,

    header,
    getTrack,
    trackKey,
    onDismiss,
    container,

    onMouseEnter,
    onMouseLeave,
    onBlur,

    className,
  }: ChartPopoverProps,
  ref: React.Ref<HTMLElement>,
) {
  const popoverObjectRef = useRef<HTMLDivElement | null>(null);

  const popoverRef = useMergeRefs(popoverObjectRef, ref);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (
        event.target &&
        !nodeBelongs(popoverObjectRef.current, event.target as Element) && // click not in popover
        !nodeContains(container, event.target as Element) // click not in segment
      ) {
        onDismiss(true);
      }
    };

    document.addEventListener("mousedown", onDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("mousedown", onDocumentClick, { capture: true });
    };
  }, [container, onDismiss]);

  // In chart popovers, dismiss button is present when they are pinned, so both values are equivalent.
  const isPinned = dismissButton;

  return (
    <div
      className={clsx(popoverStyles.root, styles.root, className)}
      ref={popoverRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onBlur={onBlur}
      // The tabIndex makes it so that clicking inside popover assigns this element as blur target.
      // That is necessary in charts to ensure the blur target is within the chart and no cleanup is needed.
      tabIndex={-1}
    >
      <PopoverContainer
        size={size}
        fixedWidth={fixedWidth}
        position={position}
        getTrack={getTrack}
        trackKey={trackKey}
        arrow={(position) => (
          <div className={clsx(popoverStyles.arrow, popoverStyles[`arrow-position-${position}`])}>
            <div className={popoverStyles["arrow-outer"]} />
            <div className={popoverStyles["arrow-inner"]} />
          </div>
        )}
        keepPosition={true}
        allowVerticalOverflow={true}
        allowScrollToFit={isPinned}
      >
        <div className={styles["hover-area"]}>
          <PopoverBody
            dismissButton={dismissButton}
            dismissAriaLabel={dismissAriaLabel}
            header={<div className={testClasses.header}>{header}</div>}
            onDismiss={() => onDismiss(false)}
            overflowVisible="content"
          >
            <div className={testClasses.body}>{children}</div>
            {footer && <div className={clsx(testClasses.footer, styles.footer)}>{footer}</div>}
          </PopoverBody>
        </div>
      </PopoverContainer>
    </div>
  );
}
