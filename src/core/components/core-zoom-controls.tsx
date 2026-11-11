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
  const lastOperation = useSelector(api.zoomStore, (s) => s.lastOperation);
  const zoomButtonRef = useRef<ToggleButtonProps.Ref>(null);
  const resetButtonRef = useRef<ButtonProps.Ref>(null);
  const handledOperation = useRef(lastOperation);

  // After a commit, Reset takes the focus once the range is applied. For a controlled range this is a render later,
  // when the consumer passes the range back, so the handled operation is kept in a ref rather than compared with the
  // previous render. After a cancel, the Zoom button takes the focus, unless the user left zoom mode by moving the
  // focus away.
  useEffect(() => {
    if (!lastOperation || lastOperation === handledOperation.current) {
      return;
    }
    if (lastOperation.type === "commit") {
      if (zoomed) {
        handledOperation.current = lastOperation;
        resetButtonRef.current?.focus();
      }
    } else {
      handledOperation.current = lastOperation;
      if (lastOperation.reason !== "blur") {
        zoomButtonRef.current?.focus();
      }
    }
  }, [lastOperation, zoomed]);

  return (
    <div
      ref={api.setZoomControls}
      role="region"
      aria-label={labels.zoomControlsAriaLabel}
      className={styles["chart-zoom-controls"]}
      onBlur={api.onZoomBlur}
    >
      <SpaceBetween size="s" direction="horizontal">
        {zoomed && !zooming && (
          <Button
            ref={resetButtonRef}
            variant="link"
            formAction="none"
            onClick={() => {
              api.resetZoom();
              zoomButtonRef.current?.focus();
            }}
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
          onChange={({ detail }) => (detail.pressed ? api.enterZoomMode() : api.exitZoomMode())}
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
