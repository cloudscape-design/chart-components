// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { applyTheme, Theme } from "@cloudscape-design/global-styles";

import App from "./app";

import "@cloudscape-design/global-styles/index.css";

const theme = new URLSearchParams(window.location.hash.split("?")[1]).get("theme");
applyTheme(theme === Theme.OneTheme ? Theme.OneTheme : Theme.VisualRefresh);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
