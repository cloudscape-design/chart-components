// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";

import { useSelector } from "../../internal/utils/async-store";
import { ChartAPI } from "../chart-api";

import styles from "../styles.css.js";
import testClasses from "../test-classes/styles.css.js";

export function VerticalAxisTitle({ api, inverted }: { api: ChartAPI; inverted: boolean }) {
  const titles = useSelector(api.store, (s) => s.axes.verticalAxesTitles).filter(Boolean);
  if (titles.length === 0) {
    return null;
  }
  return (
    <div
      className={clsx(
        testClasses["axis-vertical-title"],
        inverted ? testClasses["axis-x-title"] : testClasses["axis-y-title"],
        styles["axis-vertical-title"],
      )}
      aria-hidden={true}
    >
      {titles.map((text, index) => (
        <span key={index} className={styles["axis-vertical-title-item"]}>
          {text}
        </span>
      ))}
    </div>
  );
}
