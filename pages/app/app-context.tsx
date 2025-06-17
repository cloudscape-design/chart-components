// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { createContext, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import mapValues from "lodash/mapValues";

import { applyDensity, applyMode, Density, disableMotion, Mode } from "@cloudscape-design/global-styles";

interface AppUrlParams {
  mode: Mode;
  density: Density;
  direction: "ltr" | "rtl";
  motionDisabled: boolean;
  screenshotMode: boolean;
  i18n: boolean;
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
    screenshotMode: false,
    i18n: true,
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

function formatQuery(params: AppUrlParams) {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === appContextDefaults.urlParams[key as keyof AppUrlParams]) {
      continue;
    }
    query[key as keyof AppUrlParams] = String(value);
  }
  return query;
}

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlParams = parseQuery(searchParams) as AppUrlParams;

  function setUrlParams(newParams: Partial<AppUrlParams>) {
    setSearchParams(formatQuery({ ...urlParams, ...newParams }));

    if ((newParams.direction ?? "ltr") !== (urlParams.direction ?? "ltr")) {
      window.location.reload();
    }
  }

  useEffect(() => {
    applyMode(urlParams.mode);
  }, [urlParams.mode]);

  useEffect(() => {
    applyDensity(urlParams.density);
  }, [urlParams.density]);

  useEffect(() => {
    disableMotion(urlParams.motionDisabled);
  }, [urlParams.motionDisabled]);

  document.documentElement.setAttribute("dir", urlParams.direction);

  return <AppContext.Provider value={{ urlParams, setUrlParams: setUrlParams }}>{children}</AppContext.Provider>;
}
