// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Button from "@cloudscape-design/components/button";

import { ResolvedZoomI18n } from "./zoom-i18n";

import testClasses from "../test-classes/styles.css.js";
import styles from "./styles.css.js";

interface ZoomControlsProps {
  i18n: ResolvedZoomI18n;
  onResetZoom: () => void;
}

// The zoom controls, rendered in the chart's header area rather than over the plot. In normal flow they
// come before the chart both visually and in the focus order, so a screen reader user learns that the
// chart is zoomed, and can reset it, before reading the chart itself. It also keeps them clear of the
// axis titles and of a legend placed to the side.
export default function ZoomControls({ i18n, onResetZoom }: ZoomControlsProps) {
  return (
    <div role="region" aria-label={i18n.zoomControlsAriaLabel} className={styles.controls}>
      <Button
        variant="link"
        formAction="none"
        onClick={onResetZoom}
        ariaLabel={i18n.resetZoomButtonAriaLabel}
        className={testClasses["reset-zoom-button"]}
      >
        {i18n.resetZoomButtonText}
      </Button>
    </div>
  );
}
