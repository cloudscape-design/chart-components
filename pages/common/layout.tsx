// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";

import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";

import styles from "./styles.module.scss";

export function HeaderFilterLayout({
  defaultFilter,
  additionalFilters,
}: {
  defaultFilter: React.ReactNode;
  additionalFilters: React.ReactNode;
}) {
  return (
    <Box padding={{ bottom: "l" }}>
      <SpaceBetween
        size="l"
        direction="horizontal"
        className={clsx({ [styles["has-default-filter"]]: !!defaultFilter })}
      >
        {defaultFilter}
        {additionalFilters}
      </SpaceBetween>
    </Box>
  );
}
