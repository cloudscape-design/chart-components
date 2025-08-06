// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import dts from "rollup-plugin-dts";

export default {
  input: "lib/components/index.d.ts",
  output: {
    file: "meta/declarations.d.ts",
    format: "es",
  },
  plugins: [dts(), addFileAnnotations()],
};

function addFileAnnotations() {
  return {
    name: "file-annotations",
    generateBundle(_, bundle) {
      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type === "asset" || chunk.type === "chunk") {
          chunk.code = `/* eslint-disable */\n\n// This file includes all TS annotations to be parsed by agentic AI.\n\n ${chunk.code}`;
        }
      }
    },
  };
}
