// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import CodeView from "@cloudscape-design/code-view/code-view";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import javascriptHighlight from "@cloudscape-design/code-view/highlight/javascript";

export function CodeSnippet({ content }: { content: string }) {
  return <CodeView highlight={javascriptHighlight} content={content} lineNumbers={true} />;
}
