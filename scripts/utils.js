// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import fs from "node:fs";
import path from "node:path";

/**
 * Converts string to camelCase
 */
function camelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, "");
}

/**
 * Converts string to kebab-case
 */
function kebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function capitalize(text) {
  return text[0].toUpperCase() + text.slice(1);
}

export function pascalCase(text) {
  return capitalize(camelCase(text));
}

export function dashCase(text) {
  return kebabCase(text);
}

export function listPublicDirs(baseDir) {
  return fs
    .readdirSync(baseDir)
    .filter(
      (elem) =>
        !elem.startsWith("__") &&
        !elem.startsWith(".") &&
        elem !== "api-docs" &&
        elem !== "core" &&
        elem !== "internal" &&
        elem !== "internal-do-not-use" &&
        elem !== "index.tsx" &&
        elem !== "index.ts" &&
        elem !== "test-utils",
    );
}

export function writeSourceFile(filepath, content) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, content);
}

export function writeJSON(path, content) {
  writeSourceFile(path, JSON.stringify(content, null, 2) + "\n");
}
