// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useContainerQuery } from "@cloudscape-design/component-toolkit";

export function MeasureHeight({
  children,
  minHeight,
}: {
  children: (height: number) => React.ReactNode;
  minHeight?: number;
}) {
  const [height, measureRef] = useContainerQuery((entry) => entry.contentBoxHeight);
  return (
    <div ref={measureRef} style={{ position: "absolute", inset: 0 }}>
      {height === null ? null : children(Math.max(height, minHeight ?? height))}
    </div>
  );
}
