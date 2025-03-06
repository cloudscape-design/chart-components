// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { createContext } from "react";
import { useSearchParams } from "react-router-dom";
import mapValues from "lodash/mapValues";

import { applyDensity, applyMode, Density, Mode } from "@cloudscape-design/global-styles";

interface AppUrlParams {
  mode: Mode;
  density: Density;
  direction: "ltr" | "rtl";
  motionDisabled: boolean;
  appLayoutWidget: boolean;
}

export interface AppContextType<T = unknown> {
  pageId?: string;
  urlParams: AppUrlParams & T;
  setUrlParams: (newParams: Partial<AppUrlParams & T>) => void;
}

const appContextDefaults: AppContextType = {
  pageId: undefined,
  urlParams: {
    mode: Mode.Light,
    density: Density.Comfortable,
    direction: "ltr",
    motionDisabled: false,
    appLayoutWidget: false,
  },
  setUrlParams: () => {},
};

const AppContext = createContext<AppContextType>(appContextDefaults);

export default AppContext;

function parseQuery(urlParams: URLSearchParams) {
  const queryParams: Record<string, any> = { ...appContextDefaults.urlParams };
  urlParams.forEach((value, key) => (queryParams[key] = value));

  return mapValues(queryParams, (value) => {
    if (value === "true" || value === "false") {
      return value === "true";
    }
    return value;
  });
}

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlParams = parseQuery(searchParams) as AppUrlParams;

  function setUrlParams(newParams: Partial<AppUrlParams>) {
    if (newParams.mode !== urlParams.mode) {
      applyMode(newParams.mode ?? appContextDefaults.urlParams.mode, document.documentElement);
    }
    if (newParams.density !== urlParams.density) {
      applyDensity(newParams.density ?? appContextDefaults.urlParams.density, document.documentElement);
    }
    if (newParams.direction !== urlParams.direction) {
      document.documentElement.setAttribute("dir", newParams.direction ?? appContextDefaults.urlParams.direction);
    }
    setSearchParams({ ...searchParams, ...newParams });
  }

  return <AppContext.Provider value={{ urlParams, setUrlParams: setUrlParams }}>{children}</AppContext.Provider>;
}
