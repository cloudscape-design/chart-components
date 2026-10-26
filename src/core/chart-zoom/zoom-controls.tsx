// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";

import Button, { ButtonProps } from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { colorBackgroundButtonPrimaryActive, colorBorderButtonPrimaryActive } from "@cloudscape-design/design-tokens";

import { ResolvedZoomI18n } from "./zoom-i18n";

import testClasses from "../test-classes/styles.css.js";
import styles from "./styles.css.js";

const exitButtonStyle: ButtonProps.Style = {
  root: {
    background: {
      default: colorBackgroundButtonPrimaryActive,
      hover: colorBackgroundButtonPrimaryActive,
      active: colorBackgroundButtonPrimaryActive,
    },
    borderColor: {
      default: colorBorderButtonPrimaryActive,
      hover: colorBorderButtonPrimaryActive,
      active: colorBorderButtonPrimaryActive,
    },
  },
};

// Cloudscape buttons expose only a focus method, which is all the zoom controls need to move focus
// between them as they appear and disappear.
export interface FocusableRef {
  focus(): void;
}

interface ZoomControlsProps {
  i18n: ResolvedZoomI18n;
  // True while a range is being selected, with either the cursor or a drag.
  active: boolean;
  // True when a zoom range is applied, so the chart shows less than the full data range.
  zoomed: boolean;
  // False when the visible range is already as narrow as it can get, in which case there is nothing left
  // to zoom into and the button would do nothing.
  canZoom: boolean;
  zoomButtonRef: React.RefObject<FocusableRef>;
  resetButtonRef: React.RefObject<FocusableRef>;
  onEnterZoomMode: () => void;
  onExitZoomMode: () => void;
  onResetZoom: () => void;
}

// The zoom controls, rendered in the chart's header area rather than over the plot. In normal flow they
// come before the chart both visually and in the focus order, so a screen reader user learns that the
// chart is zoomed, and can reset it, before reading the chart itself. It also keeps them clear of the
// axis titles and of a legend placed to the side.
export default function ZoomControls({
  i18n,
  active,
  zoomed,
  canZoom,
  zoomButtonRef,
  resetButtonRef,
  onEnterZoomMode,
  onExitZoomMode,
  onResetZoom,
}: ZoomControlsProps) {
  return (
    <div
      role="region"
      aria-label={i18n.zoomControlsAriaLabel}
      className={clsx(styles.controls, testClasses["zoom-controls"])}
    >
      <SpaceBetween size="s" direction="horizontal">
        {zoomed && !active && (
          <span className={testClasses["reset-zoom-button"]}>
            <Button ref={resetButtonRef} variant="link" onClick={onResetZoom} ariaLabel={i18n.resetZoomButtonAriaLabel}>
              {i18n.resetZoomButtonText}
            </Button>
          </span>
        )}
        {!active ? (
          <span className={testClasses["zoom-button"]}>
            <Button
              ref={zoomButtonRef}
              variant="normal"
              iconName="search"
              // Zooming further is impossible once the visible range is down to its smallest step, and a
              // button that starts an interaction which cannot be completed is worse than a disabled one.
              disabled={!canZoom}
              onClick={onEnterZoomMode}
              ariaLabel={i18n.enterZoomModeButtonAriaLabel}
            >
              {i18n.enterZoomModeButtonText}
            </Button>
          </span>
        ) : (
          <span className={testClasses["exit-zoom-button"]}>
            <Button
              variant="primary"
              // Filled with the primary button's pressed color in every state, the same as the cursor step
              // buttons (see .button in styles.scss), so the controls of the active interaction read as one set.
              style={exitButtonStyle}
              onClick={onExitZoomMode}
              ariaLabel={i18n.exitZoomModeButtonAriaLabel}
            >
              {i18n.exitZoomModeButtonText}
            </Button>
          </span>
        )}
      </SpaceBetween>
    </div>
  );
}
