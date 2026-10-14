// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { escapeHtml } from "../../../../lib/components/internal/utils/utils";

describe("escapeHtml", () => {
  test.each([
    ["", ""],
    ["plain text", "plain text"],
    ["&", "&amp;"],
    ["<", "&lt;"],
    [">", "&gt;"],
    ['"', "&quot;"],
    ["'", "&#x27;"],
    ["<script>alert('x')</script>", "&lt;script&gt;alert(&#x27;x&#x27;)&lt;/script&gt;"],
    ["&amp;", "&amp;amp;"],
    ["🍕 ünïcødé", "🍕 ünïcødé"],
  ])("escapes %j", (input, expected) => {
    expect(escapeHtml(input)).toBe(expected);
  });
});
