// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import testClasses from "../test-classes/styles.css.js";

export function ChartHeader({ children }: { children: React.ReactNode }) {
  return <div className={testClasses["chart-header"]}>{children}</div>;
}

export function ChartFooter({ children }: { children: React.ReactNode }) {
  return <div className={testClasses["chart-footer"]}>{children}</div>;
}
