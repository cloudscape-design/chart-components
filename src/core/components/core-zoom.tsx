// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from "react";
import clsx from "clsx";

import Button, { ButtonProps } from "@cloudscape-design/components/button";
import Icon, { IconProps } from "@cloudscape-design/components/icon";
import LiveRegion from "@cloudscape-design/components/live-region";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";
import { ChartLabels } from "../i18n-utils";

import styles from "../styles.css.js";
import testClasses from "../test-classes/styles.css.js";

export function ChartZoomControls({ api, labels }: { api: ChartAPI; labels: ChartLabels }) {
  const inZoomMode = useSelector(api.zoomStore, (s) => s.interaction === "cursor");
  const zoomed = useSelector(api.zoomStore, (s) => s.zoomed);
  const canZoom = useSelector(api.zoomStore, (s) => s.canZoom);
  const focusRequest = useSelector(api.zoomStore, (s) => s.focusRequest);
  const zoomButtonRef = useRef<ButtonProps.Ref>(null);
  const resetButtonRef = useRef<ButtonProps.Ref>(null);

  useEffect(() => {
    if (!focusRequest) {
      return;
    }
    if (focusRequest.target === "resetButton" && resetButtonRef.current) {
      api.clearZoomFocusRequest();
      resetButtonRef.current.focus();
      return;
    }
    // A controlled range is applied once the consumer renders it, after this effect, so Reset can appear a render
    // later. Until then focus waits on the Zoom button next to it.
    const waitForReset = focusRequest.target === "resetButton" && !!zoomButtonRef.current && canZoom;
    focusZoomButton(api, zoomButtonRef.current, canZoom);
    if (!waitForReset) {
      api.clearZoomFocusRequest();
    }
  }, [api, focusRequest, zoomed, canZoom]);

  return (
    <div
      ref={api.setZoomControls}
      role="region"
      aria-label={labels.zoomControlsAriaLabel}
      className={styles["chart-zoom-controls"]}
      onBlur={api.onZoomControlsBlur}
      onKeyDown={api.onZoomControlsKeyDown}
    >
      <SpaceBetween size="s" direction="horizontal">
        {zoomed && !inZoomMode && (
          <Button
            ref={resetButtonRef}
            variant="link"
            formAction="none"
            onClick={() => {
              api.resetZoom();
              // The Reset button is removed once the reset is applied, so focus moves on as it is pressed.
              focusZoomButton(api, zoomButtonRef.current, canZoom);
            }}
            ariaLabel={labels.resetZoomButtonAriaLabel}
            className={testClasses["reset-zoom-button"]}
          >
            {labels.resetZoomButtonText}
          </Button>
        )}
        {!inZoomMode ? (
          <Button
            ref={zoomButtonRef}
            iconName="search"
            formAction="none"
            disabled={!canZoom}
            onClick={() => api.enterZoomMode()}
            ariaLabel={labels.enterZoomModeButtonAriaLabel}
            className={testClasses["zoom-button"]}
          >
            {labels.enterZoomModeButtonText}
          </Button>
        ) : (
          <Button
            variant="primary"
            iconName="search"
            formAction="none"
            onClick={() => api.exitZoomMode({ withFocus: true })}
            ariaLabel={labels.exitZoomModeButtonAriaLabel}
            className={testClasses["exit-zoom-button"]}
          >
            {labels.exitZoomModeButtonText}
          </Button>
        )}
      </SpaceBetween>
    </div>
  );
}

// The keyboard cursor and its step buttons, positioned over the plot by the zoom helper.
export function ChartZoomCursor({
  api,
  labels,
  inverted,
  isRtl,
}: {
  api: ChartAPI;
  labels: ChartLabels;
  inverted: boolean;
  isRtl: boolean;
}) {
  return (
    <>
      <div
        ref={api.setZoomCursor}
        role="slider"
        tabIndex={0}
        aria-label={labels.zoomCursorAriaLabel}
        aria-orientation={inverted ? "vertical" : "horizontal"}
        className={clsx(
          styles["chart-zoom-cursor"],
          inverted && styles["chart-zoom-cursor-vertical"],
          testClasses["zoom-cursor"],
        )}
        onKeyDown={api.onZoomCursorKeyDown}
        onBlur={api.onZoomCursorBlur}
      />
      <div
        ref={api.setZoomCluster}
        // The buttons follow the plot's physical orientation, not the page's.
        style={{ flexDirection: inverted ? "column" : isRtl ? "row-reverse" : "row" }}
        className={styles["chart-zoom-cluster"]}
      >
        <ZoomCursorButton
          iconName={stepIconName(-1, inverted, isRtl)}
          ariaLabel={labels.zoomCursorPreviousButtonAriaLabel}
          testClassName={testClasses["zoom-cursor-previous-button"]}
          onClick={() => api.stepZoomCursor(-1)}
        />
        <ZoomCursorButton
          iconName={stepIconName(1, inverted, isRtl)}
          ariaLabel={labels.zoomCursorNextButtonAriaLabel}
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
  ariaLabel?: string;
  testClassName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      // The cursor slider is the tab stop and offers the same actions. Tabbing here would end zoom mode.
      tabIndex={-1}
      aria-label={ariaLabel}
      className={clsx(styles["chart-zoom-cursor-button"], testClassName)}
      onClick={onClick}
      // Keep the press from moving focus off the cursor, which would end zoom mode.
      onPointerDown={(event) => event.preventDefault()}
    >
      <Icon name={iconName} size="small" />
    </button>
  );
}

// A disabled Zoom button cannot take focus, so the chart takes it instead.
function focusZoomButton(api: ChartAPI, zoomButton: null | ButtonProps.Ref, canZoom: boolean) {
  if (zoomButton && canZoom) {
    zoomButton.focus();
  } else {
    api.focusChart();
  }
}

// Cloudscape mirrors the horizontal arrow icons in right-to-left pages, so the name is chosen for the arrow to
// point along the plot.
function stepIconName(direction: -1 | 1, vertical: boolean, isRtl: boolean): IconProps.Name {
  if (vertical) {
    return direction === -1 ? "arrow-up" : "arrow-down";
  }
  return (direction === -1) !== isRtl ? "arrow-left" : "arrow-right";
}
