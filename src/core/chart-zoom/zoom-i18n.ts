// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";

export interface ResolvedZoomI18n {
  resetZoomButtonText: string;
  resetZoomButtonAriaLabel: string;
  zoomControlsAriaLabel: string;
  zoomResetAnnouncementText: string;
}

// The zoom messages are not yet part of the typed "[charts]" namespace of the components package, so the
// format function is used with plain string keys until they are added there.
type ZoomFormatFunction = (key: string, provided: undefined | string) => undefined | string;

// Resolves the zoom strings from the I18nProvider messages of the "[charts]" namespace, falling back to the
// English defaults.
export function useZoomI18n(): ResolvedZoomI18n {
  const i18n = useInternalI18n("[charts]") as unknown as ZoomFormatFunction;
  const text = (key: keyof ResolvedZoomI18n, fallback: string) => i18n(`i18nStrings.${key}`, undefined) ?? fallback;
  return {
    resetZoomButtonText: text("resetZoomButtonText", "Reset"),
    resetZoomButtonAriaLabel: text("resetZoomButtonAriaLabel", "Reset zoom to show full data range"),
    zoomControlsAriaLabel: text("zoomControlsAriaLabel", "Chart zoom controls"),
    zoomResetAnnouncementText: text("zoomResetAnnouncementText", "Zoom reset. Showing the full data range."),
  };
}
