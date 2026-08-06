// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";

import {
  getIsRtl,
  getLogicalBoundingClientRect,
  getScrollInlineStart,
  Portal,
} from "@cloudscape-design/component-toolkit/internal";

import styles from "./styles.css.js";

// Adapted from @cloudscape-design/components (src/internal/components/drag-handle-wrapper), which does
// not export it. Renders its children in a portal, kept aligned with the tracked element, so the zoom
// cursor buttons are not clipped by the chart's own overflow.
export default function PortalOverlay({
  track,
  isDisabled,
  children,
}: {
  track: React.RefObject<HTMLElement | null>;
  isDisabled: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (track.current) {
      const newContainer = track.current.ownerDocument.createElement("div");
      track.current.ownerDocument.body.appendChild(newContainer);
      setContainer(newContainer);
      return () => newContainer.remove();
    }
  }, [track]);

  useEffect(() => {
    if (track.current === null || isDisabled) {
      return;
    }

    let cleanedUp = false;
    let lastX: number | undefined;
    let lastY: number | undefined;
    let lastInlineSize: number | undefined;
    let lastBlockSize: number | undefined;
    const updateElement = () => {
      // Read the document from the tracked element rather than the global, so positioning stays
      // correct when the chart is rendered in another document (an iframe, or a test harness).
      const ownerDocument = ref.current?.ownerDocument ?? document;
      if (track.current && ref.current && ownerDocument.body.contains(ref.current)) {
        const isRtl = getIsRtl(ref.current);
        const { insetInlineStart, insetBlockStart, inlineSize, blockSize } = getLogicalBoundingClientRect(
          track.current,
        );
        const newX = (insetInlineStart + getScrollInlineStart(ownerDocument.documentElement)) * (isRtl ? -1 : 1);
        const newY = insetBlockStart + ownerDocument.documentElement.scrollTop;
        if (lastX !== newX || lastY !== newY) {
          ref.current.style.translate = `${newX}px ${newY}px`;
          lastX = newX;
          lastY = newY;
        }
        if (lastInlineSize !== inlineSize || lastBlockSize !== blockSize) {
          ref.current.style.width = `${inlineSize}px`;
          ref.current.style.height = `${blockSize}px`;
          lastInlineSize = inlineSize;
          lastBlockSize = blockSize;
        }
      }
      if (!cleanedUp) {
        requestAnimationFrame(updateElement);
      }
    };
    updateElement();

    return () => {
      cleanedUp = true;
    };
  }, [isDisabled, track]);

  return (
    <Portal container={container}>
      <span ref={ref} className={clsx(styles["portal-overlay"], isDisabled && styles["portal-overlay-disabled"])}>
        <span className={styles["portal-overlay-contents"]}>{children}</span>
      </span>
    </Portal>
  );
}
