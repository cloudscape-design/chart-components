// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import path from "node:path";
import { expect, test } from "vitest";

import { documentComponents } from "@cloudscape-design/documenter";

import componentDefinitions from "../../lib/components/internal/api-docs/components";
import { getAllComponents } from "./utils";

test.each<string>(getAllComponents())(`definition for %s matches the snapshot`, (componentName: string) => {
  const definition = componentDefinitions[componentName];
  expect(definition).toMatchSnapshot(componentName);
});

test("internal core API matches snapshot", () => {
  const definitions = documentComponents({
    tsconfigPath: path.resolve("tsconfig.json"),
    publicFilesGlob: "src/internal-do-not-use/core-chart/index.tsx",
  });
  expect(definitions).toMatchSnapshot("internal-core-chart");
}, 10_000);
