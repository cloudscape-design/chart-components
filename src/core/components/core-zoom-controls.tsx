// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Button from "@cloudscape-design/components/button";
import ToggleButton from "@cloudscape-design/components/toggle-button";

import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";
import { ChartLabels } from "../i18n-utils";

import styles from "../styles.css.js";
import testClasses from "../test-classes/styles.css.js";

export function ChartZoomControls({ api, labels }: { api: ChartAPI; labels: ChartLabels }) {
  const zooming = useSelector(api.zoomStore, (s) => s.zooming);
  const zoomed = useSelector(api.zoomStore, (s) => s.zoomed);
  const canZoom = useSelector(api.zoomStore, (s) => s.canZoom);

  return (
    <div
      ref={api.setZoomControls}
      role="region"
      aria-label={labels.zoomControlsAriaLabel}
      className={styles["chart-zoom-controls"]}
      onBlur={api.onZoomBlur}
    >
      {/* The Reset button is shown before it takes the focus, as the helper focuses it before the zoomed state renders. */}
      <div hidden={!zoomed || zooming}>
        <Button
          nativeButtonAttributes={{
            ref: (button) => {
              if (button) {
                api.setResetZoomButton({
                  focus: () => {
                    button.parentElement!.hidden = false;
                    button.focus();
                  },
                });
              } else {
                api.setResetZoomButton(null);
              }
            },
          }}
          variant="link"
          formAction="none"
          onClick={api.resetZoom}
          ariaLabel={labels.resetZoomButtonAriaLabel}
          className={testClasses["reset-zoom-button"]}
        >
          {labels.resetZoomButtonText}
        </Button>
      </div>
      <ToggleButton
        ref={api.setZoomButton}
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
