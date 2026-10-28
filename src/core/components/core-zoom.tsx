// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Button from "@cloudscape-design/components/button";
import LiveRegion from "@cloudscape-design/components/live-region";

import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";
import { ChartLabels } from "../i18n-utils";

import styles from "../styles.css.js";
import testClasses from "../test-classes/styles.css.js";

export function ChartZoomControls({ api, labels }: { api: ChartAPI; labels: ChartLabels }) {
  const zoomed = useSelector(api.zoomStore, (s) => s.zoomed);
  if (!zoomed) {
    return null;
  }
  return (
    <div role="region" aria-label={labels.zoomControlsAriaLabel} className={styles["chart-zoom-controls"]}>
      <Button
        variant="link"
        formAction="none"
        onClick={api.resetZoom}
        ariaLabel={labels.resetZoomButtonAriaLabel}
        className={testClasses["reset-zoom-button"]}
      >
        {labels.resetZoomButtonText}
      </Button>
    </div>
  );
}

export function ChartZoomLiveRegion({ api }: { api: ChartAPI }) {
  const announcement = useSelector(api.zoomStore, (s) => s.announcement);
  return <LiveRegion hidden={true}>{announcement}</LiveRegion>;
}
