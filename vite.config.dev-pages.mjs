// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ fastRefresh: false })],
  resolve: {
    alias: {
      lodash: "lodash-es",
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "pages/main.tsx"),
      name: "ChartComponentsDevPages",
      fileName: "main",
    },
    outDir: "lib/dev-pages/bundle",
    rollupOptions: {
      external: [/(?:\.\.\/)+?lib\/components/, /^@cloudscape-design\//, /^highcharts(^|\/)/, "react"],
    },
  },
});
