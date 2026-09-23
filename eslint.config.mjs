// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import path from "node:path";

import cloudscapeBuildTools from "@cloudscape-design/build-tools/eslint/index.js";
import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import headerPlugin from "@tony.ganchev/eslint-plugin-header";
import vitestPlugin from "@vitest/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import noUnsanitizedPlugin from "eslint-plugin-no-unsanitized";
import eslintPrettier from "eslint-plugin-prettier/recommended";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import simpleImportSortPlugin from "eslint-plugin-simple-import-sort";
import unicornPlugin from "eslint-plugin-unicorn";
import globals from "globals";
import tsEslint from "typescript-eslint";

export default tsEslint.config(
  includeIgnoreFile(path.resolve(".gitignore")),
  {
    ignores: ["lib/**", "coverage/**"],
  },
  {
    settings: {
      react: { version: "detect" },
    },
  },
  eslint.configs.recommended,
  tsEslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],
  reactHooksPlugin.configs["recommended-latest"],
  noUnsanitizedPlugin.configs.recommended,
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      "@cloudscape-design/build-tools": cloudscapeBuildTools,
      unicorn: unicornPlugin,
      header: headerPlugin,
      import: importPlugin,
      "simple-import-sort": simpleImportSortPlugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "react/display-name": "off",
      "react/no-danger": "error",
      "react/no-unstable-nested-components": ["error", { allowAsProps: true }],
      "react/forbid-component-props": ["warn", { forbid: ["className", "id"] }],
      "react/jsx-boolean-value": ["error", "always"],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
      ],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": ["error"],
      "unicorn/filename-case": "error",
      curly: "error",
      "dot-notation": "error",
      eqeqeq: "error",
      "no-return-await": "error",
      "require-await": "error",
      "@cloudscape-design/build-tools/no-internal-in-public-interfaces": "error",
      "@cloudscape-design/build-tools/react-server-components-directive": "error",
      "header/header": [
        "error",
        {
          header: {
            commentType: "line",
            lines: [
              " Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.",
              " SPDX-License-Identifier: Apache-2.0",
            ],
          },
          leadingComments: {
            comments: [
              {
                commentType: "block",
                lines: [" eslint-env node "],
              },
            ],
          },
          trailingEmptyLines: {
            minimum: 2,
          },
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              importNames: ["default"],
              message: "Prefer named imports.",
            },
            {
              name: "@cloudscape-design/components",
              message: "Prefer subpath imports.",
            },
          ],
        },
      ],
      "import/no-useless-path-segments": ["warn", { noUselessIndex: true }],
      "simple-import-sort/imports": "warn",
    },
  },
  {
    files: ["src/**"],
    ignores: ["src/**/__tests__/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportDeclaration[source.value='highcharts'][importKind='value']",
          message: "Use `import type Highcharts from 'highcharts'` instead of regular import.",
        },
        {
          selector:
            "MemberExpression[property.name='data'][object.type='TSAsExpression'][object.typeAnnotation.typeName.name='Series']",
          message:
            "Direct (x as Series).data access is unsafe due to Highcharts cropThreshold sparse arrays. Use getSeriesData() instead.",
        },
        {
          selector:
            "MemberExpression[property.name='series'][object.type='TSAsExpression'][object.typeAnnotation.typeName.name='Chart']",
          message: "Direct (x as Chart).series access may include internal series. Use getChartSeries() instead.",
        },
      ],
    },
  },
  {
    files: ["**/__integ__/**", "test/**"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      // useBrowser is not a React hook
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  {
    files: ["src/**", "pages/**", "test/**", "scripts/**"],
    rules: {
      "simple-import-sort/imports": [
        "warn",
        {
          groups: [
            // External packages come first.
            ["^react", "^(?!@cloudscape)@?\\w"],
            // Cloudscape packages.
            ["^@cloudscape"],
            // Things that start with a letter (or digit or underscore), or `~` followed by a letter.
            ["^~?\\w"],
            // Anything not matched in another group.
            ["^"],
            // Styles come last.
            ["^.+\\.?(css)$", "^.+\\.?(css.js)$", "^.+\\.?(scss)$", "^.+\\.?(selectors.js)$"],
          ],
        },
      ],
    },
  },
  {
    files: ["**/__tests__/**", "**/*.{test,spec}.{ts,tsx}", "test/**"],
    ...vitestPlugin.configs.recommended,
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      "vitest/no-focused-tests": "error",
      "vitest/no-conditional-expect": "off",
    },
  },
  eslintPrettier,
);
