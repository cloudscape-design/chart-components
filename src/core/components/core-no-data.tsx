// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";

import { Portal } from "@cloudscape-design/component-toolkit/internal";
import Button from "@cloudscape-design/components/button";
import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";
import LiveRegion from "@cloudscape-design/components/live-region";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

import { fireNonCancelableEvent } from "../../internal/events";
import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";
import { BaseI18nStrings, BaseNoDataOptions } from "../interfaces";

import styles from "../styles.css.js";
import testClasses from "../test-classes/styles.css.js";

export function ChartNoData({
  statusType = "finished",
  loading,
  empty,
  error,
  noMatch,
  onRecoveryClick,
  api,
  i18nStrings,
}: BaseNoDataOptions & {
  api: ChartAPI;
  i18nStrings?: BaseI18nStrings;
}) {
  const i18n = useInternalI18n("[charts]");
  const state = useSelector(api.nodataStore, (s) => s);
  if (!state.container) {
    return null;
  }
  let content = null;
  if (statusType === "loading") {
    const loadingText = i18n("loadingText", i18nStrings?.loadingText);
    content = loading ? (
      <div className={testClasses["no-data-loading"]}>{loading}</div>
    ) : (
      <StatusIndicator type="loading" className={testClasses["no-data-loading"]} wrapText={true}>
        {loadingText}
      </StatusIndicator>
    );
  } else if (statusType === "error") {
    const errorText = i18n("errorText", i18nStrings?.errorText);
    const recoveryText = i18n("recoveryText", i18nStrings?.recoveryText);
    content = error ? (
      <div className={testClasses["no-data-error"]}>{error}</div>
    ) : (
      <SpaceBetween direction="horizontal" size="xxs">
        <StatusIndicator type="error" className={testClasses["no-data-error"]} wrapText={true}>
          {i18n("errorText", errorText)}
        </StatusIndicator>
        {!!recoveryText && !!onRecoveryClick && (
          <Button
            onClick={(event: CustomEvent) => {
              event.preventDefault();
              fireNonCancelableEvent(onRecoveryClick);
            }}
            variant="inline-link"
            className={testClasses["no-data-retry"]}
          >
            {recoveryText}
          </Button>
        )}
      </SpaceBetween>
    );
  } else if (state.noMatch) {
    content = <div className={clsx(testClasses["no-data-no-match"], styles["no-data-empty"])}>{noMatch}</div>;
  } else {
    content = <div className={clsx(testClasses["no-data-empty"], styles["no-data-empty"])}>{empty}</div>;
  }
  return (
    <Portal container={state.container}>
      <div className={styles["no-data-wrapper"]}>
        <div className={clsx(testClasses["no-data"], styles["no-data"])}>
          <div className={styles["no-data-content"]}>
            <LiveRegion>{content}</LiveRegion>
          </div>
        </div>
      </div>
    </Portal>
  );
}
