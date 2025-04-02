// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useContainerQuery } from "@cloudscape-design/component-toolkit";

import { useMergeRefs } from "../../lib/components/internal/utils/use-merge-refs";

import styles from "./styles.module.scss";

interface ChartFrameBaseProps {
  children: React.ReactNode;
  height?: number | string;
  width?: number | string;
}

export function ChartFrame({ customAnnotation, ...props }: ChartFrameBaseProps & { customAnnotation?: string }) {
  return customAnnotation ? (
    <ChartFrameSimple {...props} annotation={customAnnotation} />
  ) : (
    <ChartFrameWithAnnotation {...props} />
  );
}

function ChartFrameSimple({ children, height, width, annotation }: ChartFrameBaseProps & { annotation: string }) {
  return (
    <div className={styles["chart-frame"]} style={{ height, width, overflow: "hidden" }}>
      {children}
      <div className={styles["chart-frame-annotation"]}>{annotation}</div>
    </div>
  );
}

function ChartFrameWithAnnotation({ children, height, width }: ChartFrameBaseProps) {
  const [measuredWidth, measureWidthRef] = useContainerQuery((entry) => entry.contentBoxWidth);
  const [measuredHeight, measureHeightRef] = useContainerQuery((entry) => entry.contentBoxHeight);
  const ref = useMergeRefs(measureWidthRef, measureHeightRef);
  return (
    <div ref={ref} className={styles["chart-frame"]} style={{ height, width, overflow: "hidden" }}>
      {children}
      <div className={styles["chart-frame-annotation"]}>
        <span>width: {measuredWidth}px, </span>
        <span>height: {measuredHeight}px</span>
      </div>
    </div>
  );
}
