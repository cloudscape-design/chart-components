// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";

import { getAllComponents, requireComponentDefinition } from "./utils";

test.each<string>(getAllComponents())(`definition for %s matches the snapshot`, (componentName: string) => {
  const definition = requireComponentDefinition(componentName);

  // overriding with a fake value so that when there are icon changes in components this test doesn't block it
  const iconNameDefinition = definition.properties.filter(({ name }: { name: string }) => name === "iconName");
  if (iconNameDefinition && iconNameDefinition[0]) {
    iconNameDefinition[0].inlineType.values = "comes from @cloudscape-design/components";
  }
  expect(definition).toMatchSnapshot(componentName);
});
