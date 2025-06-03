// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";

import { Portal } from "@cloudscape-design/component-toolkit/internal";
import Button from "@cloudscape-design/components/button";
import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";
import LiveRegion from "@cloudscape-design/components/live-region";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

import { fireNonCancelableEvent } from "../../internal/events";
import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";
import { CoreI18nStrings, CoreNoDataProps } from "../interfaces-core";

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
}: CoreNoDataProps & {
  api: ChartAPI;
  i18nStrings?: CoreI18nStrings;
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
      <StatusIndicator type="loading" className={testClasses["no-data-loading"]}>
        {loadingText}
      </StatusIndicator>
    );
  } else if (statusType === "error") {
    const errorText = i18n("errorText", i18nStrings?.errorText);
    const recoveryText = i18n("recoveryText", i18nStrings?.recoveryText);
    content = error ? (
      <div className={testClasses["no-data-error"]}>{error}</div>
    ) : (
      <span>
        <StatusIndicator type="error" className={testClasses["no-data-error"]}>
          {i18n("errorText", errorText)}
        </StatusIndicator>
        {!!recoveryText && !!onRecoveryClick && (
          <>
            {" "}
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
          </>
        )}
      </span>
    );
  } else if (state.noMatch) {
    content = <div className={testClasses["no-data-no-match"]}>{noMatch}</div>;
  } else {
    content = <div className={testClasses["no-data-empty"]}>{empty}</div>;
  }
  return (
    <Portal container={state.container}>
      <div className={styles["no-data-wrapper"]}>
        <div className={clsx(testClasses["no-data"], styles["no-data"])}>
          <LiveRegion>{content}</LiveRegion>
        </div>
      </div>
    </Portal>
  );
}
