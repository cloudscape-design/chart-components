// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";

import Icon, { IconProps } from "@cloudscape-design/components/icon";

import { ChartAPI } from "../chart-api";
import { ChartLabels } from "../i18n-utils";

import styles from "../styles.css.js";
import testClasses from "../test-classes/styles.css.js";

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

// Cloudscape mirrors the horizontal arrow icons in right-to-left pages, so the name is chosen for the arrow to
// point along the plot.
function stepIconName(direction: -1 | 1, vertical: boolean, isRtl: boolean): IconProps.Name {
  if (vertical) {
    return direction === -1 ? "arrow-up" : "arrow-down";
  }
  return (direction === -1) !== isRtl ? "arrow-left" : "arrow-right";
}
