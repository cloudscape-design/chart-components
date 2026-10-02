// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";

// The zoom strings a consumer can override. Kept in this module rather than in the chart interfaces so
// the core chart and the cartesian chart share one definition of the zoom vocabulary.
export interface ZoomI18nStrings {
  enterZoomModeButtonText?: string;
  enterZoomModeButtonAriaLabel?: string;
  exitZoomModeButtonText?: string;
  exitZoomModeButtonAriaLabel?: string;
  resetZoomButtonText?: string;
  resetZoomButtonAriaLabel?: string;
  zoomControlsAriaLabel?: string;
  zoomCursorAriaLabel?: string;
  zoomCursorPreviousButtonAriaLabel?: string;
  zoomCursorNextButtonAriaLabel?: string;
  zoomModeEnteredAnnouncementText?: (value: string) => string;
  zoomCursorPositionAnnouncementText?: (value: string) => string;
  zoomStartPointAnnouncementText?: (value: string) => string;
  zoomRangeChangeAnnouncementText?: (startValue: string, endValue: string) => string;
  zoomSelectionAnnouncementText?: (startValue: string, endValue: string) => string;
  zoomModeExitedAnnouncementText?: string;
  zoomResetAnnouncementText?: string;
}

// Every zoom string, with the consumer's overrides applied.
export type ResolvedZoomI18n = Required<ZoomI18nStrings>;

// Resolves the zoom strings against their defaults. Memoized on the strings object so its identity is
// stable across renders, keeping the zoom callbacks (which depend on the announcement formatters) from
// being recreated on every render.
export function useZoomI18n(i18nStrings: undefined | ZoomI18nStrings): ResolvedZoomI18n {
  return useMemo(
    () => ({
      enterZoomModeButtonText: i18nStrings?.enterZoomModeButtonText ?? "Zoom",
      enterZoomModeButtonAriaLabel: i18nStrings?.enterZoomModeButtonAriaLabel ?? "Enter zoom mode",
      exitZoomModeButtonText: i18nStrings?.exitZoomModeButtonText ?? "Exit zoom",
      exitZoomModeButtonAriaLabel: i18nStrings?.exitZoomModeButtonAriaLabel ?? "Exit zoom mode",
      resetZoomButtonText: i18nStrings?.resetZoomButtonText ?? "Reset",
      resetZoomButtonAriaLabel: i18nStrings?.resetZoomButtonAriaLabel ?? "Reset zoom to show full data range",
      zoomControlsAriaLabel: i18nStrings?.zoomControlsAriaLabel ?? "Chart zoom controls",
      // The cursor is a slider: the label names the control, and its value is announced from
      // aria-valuetext as it moves.
      zoomCursorAriaLabel: i18nStrings?.zoomCursorAriaLabel ?? "Zoom range cursor",
      zoomCursorPreviousButtonAriaLabel: i18nStrings?.zoomCursorPreviousButtonAriaLabel ?? "Move zoom cursor left",
      zoomCursorNextButtonAriaLabel: i18nStrings?.zoomCursorNextButtonAriaLabel ?? "Move zoom cursor right",
      zoomModeEnteredAnnouncementText:
        i18nStrings?.zoomModeEnteredAnnouncementText ??
        ((value: string) => `Zoom mode. Cursor at ${value}. Use arrow keys to move, Enter to set the start point.`),
      zoomCursorPositionAnnouncementText: i18nStrings?.zoomCursorPositionAnnouncementText ?? ((value: string) => value),
      zoomStartPointAnnouncementText:
        i18nStrings?.zoomStartPointAnnouncementText ??
        ((value: string) => `Start point set at ${value}. Move the cursor and set the end point to zoom.`),
      zoomRangeChangeAnnouncementText:
        i18nStrings?.zoomRangeChangeAnnouncementText ??
        ((startValue: string, endValue: string) => `Zoomed from ${startValue} to ${endValue}`),
      zoomSelectionAnnouncementText:
        i18nStrings?.zoomSelectionAnnouncementText ??
        ((startValue: string, endValue: string) => `Selecting zoom range from ${startValue} to ${endValue}`),
      zoomModeExitedAnnouncementText: i18nStrings?.zoomModeExitedAnnouncementText ?? "Zoom mode cancelled",
      zoomResetAnnouncementText: i18nStrings?.zoomResetAnnouncementText ?? "Zoom reset. Showing the full data range.",
    }),
    [i18nStrings],
  );
}
