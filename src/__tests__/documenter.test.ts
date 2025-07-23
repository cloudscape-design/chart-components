// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import fs from "fs";
import path from "node:path";
import os from "os";
import { expect, test } from "vitest";

import { writeComponentsDocumentation } from "@cloudscape-design/documenter";

import componentDefinitions from "../../lib/components/internal/api-docs/components";
import { getAllComponents } from "./utils";

test.each<string>(getAllComponents())(`definition for %s matches the snapshot`, (componentName: string) => {
  const definition = componentDefinitions[componentName];
  expect(definition).toMatchSnapshot(componentName);
});

test("internal core API matches snapshot", () => {
  const tmpDir = path.join(os.tmpdir(), `core-chart-docs-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  try {
    writeComponentsDocumentation({
      outDir: tmpDir,
      tsconfigPath: path.resolve("tsconfig.json"),
      publicFilesGlob: "src/internal-do-not-use/core-chart/index.tsx",
    });

    const outputPath = path.join(tmpDir, "core-chart.js");
    expect(fs.existsSync(outputPath)).toBe(true);

    const definition = fs.readFileSync(outputPath, "utf-8");
    expect(definition).toMatchSnapshot("internal-core-chart");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}, 10000);
