// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Button from "@cloudscape-design/components/button";
import LiveRegion from "@cloudscape-design/components/live-region";

import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";
import { ResolvedZoomI18n } from "../chart-zoom/zoom-i18n";

import styles from "../chart-zoom/styles.css.js";
import testClasses from "../test-classes/styles.css.js";

export function ChartZoomControls({ api, i18n }: { api: ChartAPI; i18n: ResolvedZoomI18n }) {
  const zoomed = useSelector(api.zoomStore, (s) => s.zoomed);
  if (!zoomed) {
    return null;
  }
  return (
    <div role="region" aria-label={i18n.zoomControlsAriaLabel} className={styles.controls}>
      <Button
        variant="link"
        formAction="none"
        onClick={() => {
          api.resetZoom();
          // The Reset button is removed once the reset is applied, so focus moves to the chart as it is pressed.
          api.focusChart();
        }}
        ariaLabel={i18n.resetZoomButtonAriaLabel}
        className={testClasses["reset-zoom-button"]}
      >
        {i18n.resetZoomButtonText}
      </Button>
    </div>
  );
}

export function ChartZoomLiveRegion({ api }: { api: ChartAPI }) {
  const announcement = useSelector(api.zoomStore, (s) => s.announcement);
  return <LiveRegion hidden={true}>{announcement}</LiveRegion>;
}
