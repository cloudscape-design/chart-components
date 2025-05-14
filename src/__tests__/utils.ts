/* eslint-env node */
/* eslint-disable header/header */
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { capitalize } from "lodash";
import * as fs from "node:fs";
import * as path from "node:path";

import * as components from "../../lib/components";

const componentsDir = path.resolve(__dirname, "../../lib/components");
const definitionsDir = path.resolve(__dirname, "../../lib/components/internal/api-docs/components");

export function getAllComponents(): string[] {
  return fs
    .readdirSync(componentsDir)
    .filter(
      (name) =>
        name !== "core" &&
        name !== "internal" &&
        name !== "internal-do-not-use" &&
        name !== "test-utils" &&
        !name.includes(".") &&
        !name.includes("LICENSE") &&
        !name.includes("NOTICE"),
    );
}

export function requireComponentDefinition(componentName: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require(path.join(definitionsDir, componentName));
}

export function requireComponent(componentName: string) {
  componentName = componentName.split("-").map(capitalize).join("");
  return components[componentName];
}
