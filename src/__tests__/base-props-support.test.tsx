// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from "react";
import { render } from "@testing-library/react";

import { getRequiredPropsForComponent } from "./required-props-for-components";
import { getAllComponents, requireComponent } from "./utils";

describe.each<string>(getAllComponents())(`base props support for %s`, async (componentName: string) => {
  const Component = await requireComponent(componentName);
  const props = getRequiredPropsForComponent(componentName);

  function renderComponent(ui: ReactElement) {
    return render(ui);
  }

  test("should allow data-attributes", () => {
    const { container } = renderComponent(<Component {...props} data-testid="example" />);
    expect(container.firstElementChild).toHaveAttribute("data-testid", "example");
  });

  test("data- properties should only apply to one element", () => {
    const { container } = renderComponent(<Component {...props} data-testid="data" />);
    expect(container.querySelectorAll("[data-testid=data]")).toHaveLength(1);
  });

  test("should not allow id", () => {
    const { container } = renderComponent(<Component {...props} id="example" />);
    expect(container.querySelector("#example")).toBeNull();
  });

  test("should not allow className", () => {
    const { container } = renderComponent(<Component {...props} className="example" />);
    expect(container.querySelector(".example")).toBeNull();
  });

  test("should not allow arbitrary attributes", () => {
    const { container } = renderComponent(<Component {...props} not-allowed={true} />);
    expect(container.querySelector("[not-allowed]")).toBeNull();
  });
});
