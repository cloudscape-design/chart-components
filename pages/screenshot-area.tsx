// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ReactNode } from "react";
import clsx from "clsx";

import styles from "./styles.module.scss";

export function ScreenshotArea({ children, disableAnimations }: { children: ReactNode; disableAnimations?: boolean }) {
  return <div className={clsx("screenshot-area", disableAnimations && styles["no-animation"])}>{children}</div>;
}
