// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";

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

// The zoom messages are not yet part of the typed "[charts]" namespace of the components package, so the
// format function is used with plain string keys until they are added there.
type ZoomFormatFunction = <T>(
  key: string,
  provided: T,
  handler?: (format: (args: Record<string, string>) => string) => T,
) => T;

// Resolves the zoom strings in order of precedence: the i18nStrings property, the I18nProvider messages of
// the "[charts]" namespace, and the English defaults.
export function useZoomI18n(i18nStrings: undefined | ZoomI18nStrings): ResolvedZoomI18n {
  const i18n = useInternalI18n("[charts]") as unknown as ZoomFormatFunction;
  const text = (key: keyof ZoomI18nStrings, fallback: string) =>
    i18n<undefined | string>(`i18nStrings.${key}`, i18nStrings?.[key] as undefined | string) ?? fallback;
  const valueText = (key: keyof ZoomI18nStrings, fallback: (value: string) => string) =>
    i18n<undefined | ((value: string) => string)>(
      `i18nStrings.${key}`,
      i18nStrings?.[key] as undefined | ((value: string) => string),
      (format) => (value) => format({ value }),
    ) ?? fallback;
  const rangeText = (key: keyof ZoomI18nStrings, fallback: (startValue: string, endValue: string) => string) =>
    i18n<undefined | ((startValue: string, endValue: string) => string)>(
      `i18nStrings.${key}`,
      i18nStrings?.[key] as undefined | ((startValue: string, endValue: string) => string),
      (format) => (startValue, endValue) => format({ startValue, endValue }),
    ) ?? fallback;
  return {
    enterZoomModeButtonText: text("enterZoomModeButtonText", "Zoom"),
    enterZoomModeButtonAriaLabel: text("enterZoomModeButtonAriaLabel", "Enter zoom mode"),
    exitZoomModeButtonText: text("exitZoomModeButtonText", "Exit zoom"),
    exitZoomModeButtonAriaLabel: text("exitZoomModeButtonAriaLabel", "Exit zoom mode"),
    resetZoomButtonText: text("resetZoomButtonText", "Reset"),
    resetZoomButtonAriaLabel: text("resetZoomButtonAriaLabel", "Reset zoom to show full data range"),
    zoomControlsAriaLabel: text("zoomControlsAriaLabel", "Chart zoom controls"),
    // The cursor is a slider: the label names the control, and its value is announced from
    // aria-valuetext as it moves.
    zoomCursorAriaLabel: text("zoomCursorAriaLabel", "Zoom range cursor"),
    // The buttons move the cursor along the x axis, which runs vertically in inverted charts, so the
    // defaults name the direction along the axis rather than on screen.
    zoomCursorPreviousButtonAriaLabel: text("zoomCursorPreviousButtonAriaLabel", "Move zoom cursor to previous point"),
    zoomCursorNextButtonAriaLabel: text("zoomCursorNextButtonAriaLabel", "Move zoom cursor to next point"),
    zoomModeEnteredAnnouncementText: valueText(
      "zoomModeEnteredAnnouncementText",
      (value) => `Zoom mode. Cursor at ${value}. Use arrow keys to move, Enter to set the start point.`,
    ),
    zoomCursorPositionAnnouncementText: valueText("zoomCursorPositionAnnouncementText", (value) => value),
    zoomStartPointAnnouncementText: valueText(
      "zoomStartPointAnnouncementText",
      (value) => `Start point set at ${value}. Move the cursor and set the end point to zoom.`,
    ),
    zoomRangeChangeAnnouncementText: rangeText(
      "zoomRangeChangeAnnouncementText",
      (startValue, endValue) => `Zoomed from ${startValue} to ${endValue}`,
    ),
    zoomSelectionAnnouncementText: rangeText(
      "zoomSelectionAnnouncementText",
      (startValue, endValue) => `Selecting zoom range from ${startValue} to ${endValue}`,
    ),
    zoomModeExitedAnnouncementText: text("zoomModeExitedAnnouncementText", "Zoom mode cancelled"),
    zoomResetAnnouncementText: text("zoomResetAnnouncementText", "Zoom reset. Showing the full data range."),
  };
}
