// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from "vitest";

import componentDefinitions from "../../lib/components/internal/api-docs/components";
import { getAllComponents } from "./utils";
test.each<string>(getAllComponents())(`definition for %s matches the snapshot`, (componentName: string) => {
  const definition = componentDefinitions[componentName];

  // overriding with a fake value so that when there are icon changes in components this test doesn't block it
  const iconNameDefinition = definition.properties.find(({ name }: { name: string }) => name === "iconName");
  if (iconNameDefinition && iconNameDefinition.inlineType?.type === "union") {
    iconNameDefinition.inlineType.values = ["comes from @cloudscape-design/components"];
  }
  expect(definition).toMatchSnapshot(componentName);
});
