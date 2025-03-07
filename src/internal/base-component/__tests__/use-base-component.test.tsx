// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { render } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { COMPONENT_METADATA_KEY } from "@cloudscape-design/component-toolkit/internal";

import useBaseComponent, {
  InternalBaseComponentProps,
} from "../../../../lib/components/internal/base-component/use-base-component";
import { useTelemetry } from "../../../../lib/components/internal/base-component/use-telemetry";
import { PACKAGE_VERSION } from "../../../../lib/components/internal/environment";

type InternalDemoProps = InternalBaseComponentProps;
function InternalDemo({ __internalRootRef }: InternalDemoProps) {
  return <div ref={__internalRootRef}>Internal Demo Component</div>;
}

function Demo({ variant }: { variant: string }) {
  const baseComponentProps = useBaseComponent("DemoComponent", { props: { variant } });
  return <InternalDemo {...baseComponentProps} />;
}

vi.mock("../../../../lib/components/internal/base-component/use-telemetry", () => {
  return { useTelemetry: vi.fn(() => null) };
});

test("should attach the metadata to the returned root DOM node", () => {
  const { container } = render(<Demo variant="default" />);
  const rootNode: any = container.firstChild;
  expect(rootNode[COMPONENT_METADATA_KEY]?.name).toBe("DemoComponent");
  expect(rootNode[COMPONENT_METADATA_KEY]?.version).toBe(PACKAGE_VERSION);
});

test("should call the useTelemetry hook passing down the given component name and its props", () => {
  vi.resetAllMocks();
  render(<Demo variant="default" />);
  expect(useTelemetry).toHaveBeenCalledWith("DemoComponent", { props: { variant: "default" } });
});
