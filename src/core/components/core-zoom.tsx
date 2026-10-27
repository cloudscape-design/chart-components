// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from "react";
import clsx from "clsx";

import Button, { ButtonProps } from "@cloudscape-design/components/button";
import Icon, { IconProps } from "@cloudscape-design/components/icon";
import LiveRegion from "@cloudscape-design/components/live-region";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { colorBackgroundButtonPrimaryActive, colorBorderButtonPrimaryActive } from "@cloudscape-design/design-tokens";

import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";
import { ResolvedZoomI18n } from "../chart-zoom/zoom-i18n";

import styles from "../chart-zoom/styles.css.js";
import testClasses from "../test-classes/styles.css.js";

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

export function ChartZoomControls({ api, i18n }: { api: ChartAPI; i18n: ResolvedZoomI18n }) {
  const active = useSelector(api.zoomStore, (s) => s.interaction === "cursor");
  const zoomed = useSelector(api.zoomStore, (s) => s.zoomed);
  const canZoom = useSelector(api.zoomStore, (s) => s.canZoom);
  const focusRequest = useSelector(api.zoomStore, (s) => s.focusRequest);
  const zoomButtonRef = useRef<ButtonProps.Ref>(null);
  const resetButtonRef = useRef<ButtonProps.Ref>(null);

  useEffect(() => {
    if (!focusRequest) {
      return;
    }
    api.clearZoomFocusRequest();
    const candidates = focusRequest.target === "resetButton" ? [resetButtonRef, zoomButtonRef] : [zoomButtonRef];
    const button = candidates.map((ref) => ref.current).find(Boolean);
    if (button) {
      button.focus();
    } else {
      api.focusChart();
    }
  }, [api, focusRequest]);

  return (
    <div ref={api.setZoomControls} role="region" aria-label={i18n.zoomControlsAriaLabel} className={styles.controls}>
      <SpaceBetween size="s" direction="horizontal">
        {zoomed && !active && (
          <Button
            ref={resetButtonRef}
            variant="link"
            formAction="none"
            onClick={() => {
              api.resetZoom({ withFocus: false, isApiCall: false });
              // The Reset button is removed once the reset is applied, so focus moves on as it is pressed.
              if (zoomButtonRef.current) {
                zoomButtonRef.current.focus();
              } else {
                api.focusChart();
              }
            }}
            ariaLabel={i18n.resetZoomButtonAriaLabel}
            className={testClasses["reset-zoom-button"]}
          >
            {i18n.resetZoomButtonText}
          </Button>
        )}
        {!active ? (
          <Button
            ref={zoomButtonRef}
            iconName="search"
            formAction="none"
            disabled={!canZoom}
            onClick={() => api.enterZoomMode()}
            ariaLabel={i18n.enterZoomModeButtonAriaLabel}
            className={testClasses["zoom-button"]}
          >
            {i18n.enterZoomModeButtonText}
          </Button>
        ) : (
          <Button
            variant="primary"
            formAction="none"
            style={exitButtonStyle}
            onClick={() => api.exitZoomMode({ withFocus: true })}
            ariaLabel={i18n.exitZoomModeButtonAriaLabel}
            className={testClasses["exit-zoom-button"]}
          >
            {i18n.exitZoomModeButtonText}
          </Button>
        )}
      </SpaceBetween>
    </div>
  );
}

// The keyboard cursor and its step buttons, positioned over the plot by the zoom helper.
export function ChartZoomCursor({
  api,
  i18n,
  inverted,
  isRtl,
}: {
  api: ChartAPI;
  i18n: ResolvedZoomI18n;
  inverted: boolean;
  isRtl: boolean;
}) {
  return (
    <>
      <div
        ref={api.setZoomCursor}
        role="slider"
        tabIndex={0}
        aria-label={i18n.zoomCursorAriaLabel}
        aria-orientation={inverted ? "vertical" : "horizontal"}
        className={clsx(styles.cursor, inverted && styles["cursor-vertical"], testClasses["zoom-cursor"])}
        onKeyDown={api.onZoomCursorKeyDown}
        onBlur={api.onZoomCursorBlur}
      />
      <div
        ref={api.setZoomCluster}
        // The buttons follow the plot's physical orientation, not the page's.
        style={{ flexDirection: inverted ? "column" : isRtl ? "row-reverse" : "row" }}
        className={styles.cluster}
      >
        <ZoomCursorButton
          iconName={stepIconName(-1, inverted, isRtl)}
          ariaLabel={i18n.zoomCursorPreviousButtonAriaLabel}
          testClassName={testClasses["zoom-cursor-previous-button"]}
          onClick={() => api.stepZoomCursor(-1)}
        />
        <ZoomCursorButton
          iconName={stepIconName(1, inverted, isRtl)}
          ariaLabel={i18n.zoomCursorNextButtonAriaLabel}
          testClassName={testClasses["zoom-cursor-next-button"]}
          onClick={() => api.stepZoomCursor(1)}
        />
      </div>
    </>
  );
}

export function ChartZoomLiveRegion({ api }: { api: ChartAPI }) {
  const announcement = useSelector(api.zoomStore, (s) => s.announcement);
  return <LiveRegion hidden={true}>{announcement}</LiveRegion>;
}

function ZoomCursorButton({
  iconName,
  ariaLabel,
  testClassName,
  onClick,
}: {
  iconName: IconProps.Name;
  ariaLabel: string;
  testClassName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      // The cursor slider is the tab stop and offers the same actions. Tabbing here would end zoom mode.
      tabIndex={-1}
      aria-label={ariaLabel}
      className={clsx(styles.button, testClassName)}
      onClick={onClick}
      // Keep the press from moving focus off the cursor, which would end zoom mode.
      onPointerDown={(event) => event.preventDefault()}
    >
      <Icon name={iconName} size="small" />
    </button>
  );
}

// Cloudscape mirrors the horizontal arrow icons in right-to-left pages, so the name is chosen for the arrow to
// point along the plot.
function stepIconName(direction: -1 | 1, vertical: boolean, isRtl: boolean): IconProps.Name {
  if (vertical) {
    return direction === -1 ? "arrow-up" : "arrow-down";
  }
  return (direction === -1) !== isRtl ? "arrow-left" : "arrow-right";
}
