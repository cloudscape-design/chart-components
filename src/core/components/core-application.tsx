// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";

import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";

import styles from "../styles.css.js";
import testClasses from "../test-classes/styles.css.js";

// An invisible component rendered before chart plot to capture focus for custom keyboard navigation.
export function ChartApplication({
  api,
  keyboardNavigation,
  ariaLabel,
}: {
  api: ChartAPI;
  keyboardNavigation: boolean;
  ariaLabel?: string;
}) {
  const hasData = useSelector(api.nodataStore, (s) => !s.visible);
  return keyboardNavigation && hasData ? (
    // Do not remove the empty outer div. It is used to contain the application element to perform
    // focus juggling, necessary to trigger a screen-reader announcement.
    <div>
      <div
        ref={api.setApplication}
        tabIndex={0}
        role="application"
        aria-label={ariaLabel}
        className={clsx(testClasses.application, styles.application)}
      />
    </div>
  ) : null;
}
