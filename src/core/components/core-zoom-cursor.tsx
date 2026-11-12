// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";

import { ChartAPI } from "../chart-api";
import { ChartLabels } from "../i18n-utils";

import styles from "../styles.css.js";
import testClasses from "../test-classes/styles.css.js";

export function ChartZoomCursor({ api, labels, inverted }: { api: ChartAPI; labels: ChartLabels; inverted: boolean }) {
  return (
    <div
      ref={api.setZoomCursor}
      role="slider"
      tabIndex={0}
      aria-label={labels.zoomCursorAriaLabel}
      aria-orientation={inverted ? "vertical" : "horizontal"}
      className={clsx(styles["chart-zoom-cursor"], testClasses["zoom-cursor"])}
      onKeyDown={api.onZoomCursorKeyDown}
      onBlur={api.onZoomBlur}
    />
  );
}
