// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { createContext, ReactNode, useContext } from "react";
import clsx from "clsx";

import AppContext from "../app/app-context";

import styles from "./styles.module.scss";

export const ScreenshotAreaContext = createContext<boolean>(false);

export function ScreenshotArea({ children }: { children: ReactNode }) {
  const { urlParams } = useContext(AppContext);
  return (
    <ScreenshotAreaContext.Provider value={!!urlParams.screenshotMode}>
      <div className={clsx("screenshot-area", urlParams.screenshotMode && styles["no-animation"])}>{children}</div>
    </ScreenshotAreaContext.Provider>
  );
}
