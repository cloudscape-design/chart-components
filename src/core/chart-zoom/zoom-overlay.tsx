// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";

import Icon, { IconProps } from "@cloudscape-design/components/icon";

import { ResolvedZoomI18n } from "./zoom-i18n";

import testClasses from "../test-classes/styles.css.js";
import styles from "./styles.css.js";

// The direction the cursor moves in, expressed in pixels rather than in data values: -1 moves towards
// the start of the plot on screen, +1 towards its end. The hook translates that into a value step, which
// is the opposite when the axis is reversed. Sharing the pixel convention with the arrow keys keeps the
// buttons pointing where the cursor actually goes.
export type PixelDirection = -1 | 1;

// Elements the zoom hook writes to directly. Everything on the cursor-move and drag hot paths is applied
// imperatively: a React re-render of the chart re-initializes the Highcharts axes, which is far too
// expensive to do per pointer event.
export interface ZoomOverlayRefs {
  band: React.RefObject<HTMLDivElement>;
  startDivider: React.RefObject<HTMLDivElement>;
  endDivider: React.RefObject<HTMLDivElement>;
  cursor: React.RefObject<HTMLDivElement>;
  cluster: React.RefObject<HTMLDivElement>;
  previousButton: React.RefObject<HTMLButtonElement>;
  nextButton: React.RefObject<HTMLButtonElement>;
}

interface ZoomOverlayProps {
  refs: ZoomOverlayRefs;
  i18n: ResolvedZoomI18n;
  // True when the x axis runs vertically, which is the case in inverted charts.
  vertical: boolean;
  isRtl: boolean;
  onKeyDown: React.KeyboardEventHandler;
  onBlur: React.FocusEventHandler;
  onStep: (direction: PixelDirection) => void;
}

// Everything drawn on top of the plot while a zoom interaction is in progress: the selected range, the
// boundaries of the selection, the keyboard cursor, and the cursor's pointer controls. The overlay covers
// the plot but lets pointer events through, so hovering and dragging the chart keep working; only the
// buttons opt back in.
export default function ZoomOverlay({ refs, i18n, vertical, isRtl, onKeyDown, onBlur, onStep }: ZoomOverlayProps) {
  return (
    <div className={styles.overlay}>
      <div ref={refs.band} className={styles.band} />
      <div ref={refs.startDivider} className={styles.divider} />
      <div ref={refs.endDivider} className={styles.divider} />

      {/*
        The cursor is a real slider so that its position is announced as it moves, without a live region,
        and so that the arrow keys it handles are the ones assistive technology expects. Its value and
        range are written imperatively by the hook; a keyboard step must not re-render the chart.
      */}
      <div
        ref={refs.cursor}
        role="slider"
        tabIndex={0}
        aria-label={i18n.zoomCursorAriaLabel}
        aria-orientation={vertical ? "vertical" : "horizontal"}
        className={clsx(styles.cursor, vertical && styles["cursor-vertical"], testClasses["zoom-cursor"])}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      />

      <div
        ref={refs.cluster}
        // The cluster follows the plot's physical orientation, not the page's: the button that moves the
        // cursor towards the start of the plot on screen must sit on that side of the cluster.
        style={{ flexDirection: vertical ? "column" : isRtl ? "row-reverse" : "row" }}
        className={styles.cluster}
      >
        <ZoomCursorButton
          buttonRef={refs.previousButton}
          iconName={stepIconName(-1, vertical, isRtl)}
          ariaLabel={i18n.zoomCursorPreviousButtonAriaLabel}
          testClassName={testClasses["zoom-cursor-previous-button"]}
          onClick={() => onStep(-1)}
        />
        <ZoomCursorButton
          buttonRef={refs.nextButton}
          iconName={stepIconName(1, vertical, isRtl)}
          ariaLabel={i18n.zoomCursorNextButtonAriaLabel}
          testClassName={testClasses["zoom-cursor-next-button"]}
          onClick={() => onStep(1)}
        />
      </div>
    </div>
  );
}

interface ZoomCursorButtonProps {
  buttonRef: React.RefObject<HTMLButtonElement>;
  iconName: IconProps.Name;
  ariaLabel: string;
  testClassName: string;
  onClick: () => void;
}

function ZoomCursorButton({ buttonRef, iconName, ariaLabel, testClassName, onClick }: ZoomCursorButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      // The buttons are not part of the tab sequence: the cursor slider is, and it offers the same
      // actions from the keyboard. Tabbing onto them would take focus off the cursor and end zoom mode.
      tabIndex={-1}
      aria-label={ariaLabel}
      className={clsx(styles.button, testClassName)}
      onClick={onClick}
      // Keep the press from moving focus off the cursor, which would end the zoom interaction.
      onPointerDown={(event) => event.preventDefault()}
    >
      <Icon name={iconName} size="small" />
    </button>
  );
}

// The arrow to draw on a step button. Cloudscape mirrors the horizontal arrow icons in right-to-left
// pages, so the name is chosen such that the rendered arrow points along the plot, whichever way the
// page runs. The vertical arrows are never mirrored.
function stepIconName(direction: PixelDirection, vertical: boolean, isRtl: boolean): IconProps.Name {
  if (vertical) {
    return direction === -1 ? "arrow-up" : "arrow-down";
  }
  const pointsPhysicallyLeft = direction === -1;
  return pointsPhysicallyLeft !== isRtl ? "arrow-left" : "arrow-right";
}
