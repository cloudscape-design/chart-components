// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";

import Button from "@cloudscape-design/components/button";
import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";
import LiveRegion from "@cloudscape-design/components/live-region";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

import { fireNonCancelableEvent, NonCancelableEventHandler } from "../../internal/events";
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
  const state = useSelector(api.nodataStore, (s) => s);
  if (!state.visible) {
    return null;
  }
  let content = null;
  if (statusType === "loading") {
    content = loading ? (
      <div className={testClasses["no-data-loading"]}>{loading}</div>
    ) : (
      <DefaultLoadingMessage i18nStrings={i18nStrings} />
    );
  } else if (statusType === "error") {
    content = error ? (
      <div className={testClasses["no-data-error"]}>{error}</div>
    ) : (
      <DefaultErrorMessage onRecoveryClick={onRecoveryClick} i18nStrings={i18nStrings} />
    );
  } else if (state.noMatch && noMatch) {
    content = <div className={clsx(testClasses["no-data-no-match"], styles["no-data-empty"])}>{noMatch}</div>;
  } else if (!state.noMatch && empty) {
    content = <div className={clsx(testClasses["no-data-empty"], styles["no-data-empty"])}>{empty}</div>;
  }
  return (
    content && (
      <div className={styles["no-data-container"]} style={state.style}>
        <div className={styles["no-data-wrapper"]}>
          <div className={clsx(testClasses["no-data"], styles["no-data"])}>
            <LiveRegion>{content}</LiveRegion>
          </div>
        </div>
      </div>
    )
  );
}

function DefaultLoadingMessage({ i18nStrings }: { i18nStrings?: BaseI18nStrings }) {
  const i18n = useInternalI18n("[charts]");
  const loadingText = i18n("loadingText", i18nStrings?.loadingText);
  return (
    <StatusIndicator type="loading" className={testClasses["no-data-loading"]} wrapText={true}>
      {loadingText}
    </StatusIndicator>
  );
}

function DefaultErrorMessage({
  onRecoveryClick,
  i18nStrings,
}: {
  onRecoveryClick?: NonCancelableEventHandler;
  i18nStrings?: BaseI18nStrings;
}) {
  const i18n = useInternalI18n("[charts]");
  const errorText = i18n("errorText", i18nStrings?.errorText);
  const recoveryText = i18n("recoveryText", i18nStrings?.recoveryText);
  return (
    <SpaceBetween direction="horizontal" size="xxs" className={testClasses["no-data-error"]}>
      <StatusIndicator type="error" wrapText={true}>
        {errorText}
      </StatusIndicator>
      {recoveryText && onRecoveryClick ? (
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
      ) : null}
    </SpaceBetween>
  );
}
