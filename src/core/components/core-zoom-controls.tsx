// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useRef } from "react";

import Button, { ButtonProps } from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import ToggleButton, { ToggleButtonProps } from "@cloudscape-design/components/toggle-button";

import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";
import { ChartLabels } from "../i18n-utils";

import styles from "../styles.css.js";
import testClasses from "../test-classes/styles.css.js";

export function ChartZoomControls({ api, labels }: { api: ChartAPI; labels: ChartLabels }) {
  const zooming = useSelector(api.zoomStore, (s) => s.zooming);
  const zoomed = useSelector(api.zoomStore, (s) => s.zoomed);
  const canZoom = useSelector(api.zoomStore, (s) => s.canZoom);
  const zoomButtonRef = useRef<ToggleButtonProps.Ref>(null);
  const resetButtonRef = useRef<ButtonProps.Ref>(null);
  const focusResetOnRender = useRef(false);

  useEffect(() => {
    api.setZoomButton({ focus: () => zoomButtonRef.current?.focus() });
    api.setResetZoomButton({
      focus: () => {
        if (resetButtonRef.current) {
          resetButtonRef.current.focus();
        } else {
          focusResetOnRender.current = true;
          zoomButtonRef.current?.focus();
        }
      },
    });
    return () => {
      api.setZoomButton(null);
      api.setResetZoomButton(null);
    };
  }, [api]);

  useEffect(() => {
    if (zooming) {
      focusResetOnRender.current = false;
    } else if (focusResetOnRender.current && resetButtonRef.current) {
      focusResetOnRender.current = false;
      resetButtonRef.current.focus();
    }
  }, [zoomed, zooming]);

  return (
    <div
      ref={api.setZoomControls}
      role="region"
      aria-label={labels.zoomControlsAriaLabel}
      className={styles["chart-zoom-controls"]}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          focusResetOnRender.current = false;
        }
        api.onZoomBlur(event);
      }}
    >
      <SpaceBetween size="s" direction="horizontal">
        {zoomed && !zooming && (
          <Button
            ref={resetButtonRef}
            variant="link"
            formAction="none"
            onClick={() => api.resetZoom({ withFocus: true })}
            ariaLabel={labels.resetZoomButtonAriaLabel}
            className={testClasses["reset-zoom-button"]}
          >
            {labels.resetZoomButtonText}
          </Button>
        )}
        <ToggleButton
          ref={zoomButtonRef}
          pressed={zooming}
          iconName="zoom-in"
          pressedIconSvg={zoomModeIcon}
          disabled={!canZoom && !zooming}
          disabledReason={labels.zoomButtonDisabledReason}
          onChange={({ detail }) => (detail.pressed ? api.enterZoomMode() : api.exitZoomMode({ withFocus: true }))}
          className={zooming ? testClasses["exit-zoom-button"] : testClasses["zoom-button"]}
        >
          {labels.enterZoomModeButtonText}
        </ToggleButton>
      </SpaceBetween>
    </div>
  );
}

const zoomModeIcon = (
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" focusable="false">
    <path d="M11 11L15 15" />
    <path
      className="filled no-stroke"
      d="M7 1C10.3137 1 13 3.68629 13 7C13 10.3137 10.3137 13 7 13C3.68629 13 1 10.3137 1 7C1 3.68629 3.68629 1 7 1ZM6.25 4V6.25H4V7.75H6.25V10H7.75V7.75H10V6.25H7.75V4H6.25Z"
    />
    <circle cx="7" cy="7" r="6" />
  </svg>
);
