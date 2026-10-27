// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useInternalI18n } from "@cloudscape-design/components/internal/do-not-use/i18n";

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

export type ResolvedZoomI18n = Required<ZoomI18nStrings>;

// The zoom messages are not yet part of the typed "[charts]" namespace of the components package, so the
// format function is used with plain string keys until they are added there.
type ZoomFormatFunction = <T>(
  key: string,
  provided: T,
  handler?: (format: (args: Record<string, string>) => string) => T,
) => T;

type ValueFormat = (value: string) => string;
type RangeFormat = (startValue: string, endValue: string) => string;

// Resolves the zoom strings from the i18nStrings property, then the I18nProvider messages, and falls back to
// empty strings like the other chart strings.
export function useZoomI18n(i18nStrings: undefined | ZoomI18nStrings): ResolvedZoomI18n {
  const i18n = useInternalI18n("[charts]") as unknown as ZoomFormatFunction;
  const text = (key: keyof ZoomI18nStrings) =>
    i18n<undefined | string>(`i18nStrings.${key}`, i18nStrings?.[key] as undefined | string) ?? "";
  const valueText = (key: keyof ZoomI18nStrings, fallback: ValueFormat = () => ""): ValueFormat =>
    i18n<undefined | ValueFormat>(
      `i18nStrings.${key}`,
      i18nStrings?.[key] as undefined | ValueFormat,
      (format) => (value) => format({ value }),
    ) ?? fallback;
  const rangeText = (key: keyof ZoomI18nStrings): RangeFormat =>
    i18n<undefined | RangeFormat>(
      `i18nStrings.${key}`,
      i18nStrings?.[key] as undefined | RangeFormat,
      (format) => (startValue, endValue) => format({ startValue, endValue }),
    ) ?? (() => "");
  return {
    enterZoomModeButtonText: text("enterZoomModeButtonText"),
    enterZoomModeButtonAriaLabel: text("enterZoomModeButtonAriaLabel"),
    exitZoomModeButtonText: text("exitZoomModeButtonText"),
    exitZoomModeButtonAriaLabel: text("exitZoomModeButtonAriaLabel"),
    resetZoomButtonText: text("resetZoomButtonText"),
    resetZoomButtonAriaLabel: text("resetZoomButtonAriaLabel"),
    zoomControlsAriaLabel: text("zoomControlsAriaLabel"),
    zoomCursorAriaLabel: text("zoomCursorAriaLabel"),
    zoomCursorPreviousButtonAriaLabel: text("zoomCursorPreviousButtonAriaLabel"),
    zoomCursorNextButtonAriaLabel: text("zoomCursorNextButtonAriaLabel"),
    zoomModeEnteredAnnouncementText: valueText("zoomModeEnteredAnnouncementText"),
    // The cursor position is the formatted value itself, which needs no translation.
    zoomCursorPositionAnnouncementText: valueText("zoomCursorPositionAnnouncementText", (value) => value),
    zoomStartPointAnnouncementText: valueText("zoomStartPointAnnouncementText"),
    zoomRangeChangeAnnouncementText: rangeText("zoomRangeChangeAnnouncementText"),
    zoomSelectionAnnouncementText: rangeText("zoomSelectionAnnouncementText"),
    zoomModeExitedAnnouncementText: text("zoomModeExitedAnnouncementText"),
    zoomResetAnnouncementText: text("zoomResetAnnouncementText"),
  };
}
