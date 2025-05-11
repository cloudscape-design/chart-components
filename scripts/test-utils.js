// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { execaSync } from "execa";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { generateTestUtils } from "@cloudscape-design/test-utils-converter";

// The `generateTestUtils` method produces dom- and selectors index files.
// In this project, that is not needed. Instead, we define the index files separately.
// To achieve that, we need to overwrite the generated index files content.
const domIndex = readFileSync("src/test-utils/dom/index.ts");
const selectorsIndex = readFileSync("src/test-utils/selectors/index.ts");

generateTestUtils({
  testUtilsPath: path.resolve("src/test-utils"),
  components: [],
});

writeFileSync("src/test-utils/dom/index.ts", domIndex);
writeFileSync("src/test-utils/selectors/index.ts", selectorsIndex);

function compileTypescript() {
  const config = path.resolve("src/test-utils/tsconfig.json");
  execaSync("tsc", ["-p", config, "--sourceMap", "--inlineSources"], { stdio: "inherit" });
}

compileTypescript();
