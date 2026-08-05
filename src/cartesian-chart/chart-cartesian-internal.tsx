// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type Highcharts from "highcharts";

import { useControllableState } from "@cloudscape-design/component-toolkit";
import Button from "@cloudscape-design/components/button";
import LiveRegion from "@cloudscape-design/components/live-region";
import SpaceBetween from "@cloudscape-design/components/space-between";
import {
  colorBackgroundButtonNormalActive,
  colorBackgroundItemSelected,
  colorBorderItemSelected,
} from "@cloudscape-design/design-tokens";

import { InternalCoreChart } from "../core/chart-core";
import { CoreChartProps, ErrorBarSeriesOptions } from "../core/interfaces";
import { getOptionsId, isXThreshold } from "../core/utils";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
import DirectionButton from "../internal/components/zoom-cursor-buttons/direction-button";
import PortalOverlay from "../internal/components/zoom-cursor-buttons/portal-overlay";
import { fireNonCancelableEvent } from "../internal/events";
import { getChartSeries, getSeriesData } from "../internal/utils/highcharts";
import { castArray, SomeRequired } from "../internal/utils/utils";
import { transformCartesianSeries } from "./chart-series-cartesian";
import { CartesianChartProps, NonErrorBarSeriesOptions } from "./interfaces";

import styles from "./styles.css.js";
import testClasses from "./test-classes/styles.css.js";

interface InternalCartesianChartProps extends InternalBaseComponentProps, CartesianChartProps {
  tooltip: SomeRequired<CartesianChartProps.TooltipOptions, "enabled" | "placement" | "size">;
  legend: SomeRequired<CartesianChartProps.LegendOptions, "enabled">;
}

const ZOOM_SELECTION_BAND_ID = "awsui-zoom-selection";
const ZOOM_ANCHOR_LINE_ID = "awsui-zoom-anchor";
const ZOOM_CURSOR_LINE_ID = "awsui-zoom-cursor";
// Overlays that mark the boundaries of the currently zoomed range: two vertical lines at the
// zoomed min/max plus a subtle band tint between them, shown while the chart is zoomed.
const ZOOM_RANGE_BAND_ID = "awsui-zoom-range";
const ZOOM_RANGE_START_LINE_ID = "awsui-zoom-range-start";
const ZOOM_RANGE_END_LINE_ID = "awsui-zoom-range-end";
// Boundary lines drawn at the edges of the native drag-to-zoom selection, so dragging shows the same
// dividers as a click/keyboard selection.
const ZOOM_DRAG_START_LINE_ID = "awsui-zoom-drag-start";
const ZOOM_DRAG_END_LINE_ID = "awsui-zoom-drag-end";

// Shared style for the vertical zoom divider lines: the range boundary lines shown while the chart
// is zoomed and the selection anchor line shown while selecting. Both use the same dark-blue, 1px,
// solid style so every divider/selection edge matches exactly across the design.
const ZOOM_DIVIDER_COLOR = colorBorderItemSelected;
const ZOOM_DIVIDER_WIDTH = 1;

// The states a chart with zooming enabled moves through:
// "idle" — not zoomed, showing the "Zoom" button.
// "zoomMode" — showing the "Exit zoom" button, with the tooltip suppressed. A vertical cursor follows
//   the pointer and the arrow keys, waiting for the start of the range (click / Enter / Space).
// "selecting" — the start of the range is set, and the highlight band spans from it to the cursor,
//   waiting for the end of the range (click / Enter / Space) to apply the zoom.
// "zoomed" — showing the "Reset" button, and the "Zoom" button next to it, so a narrower range can be
//   selected without resetting first. Doing so returns to "zoomMode", and cancelling from there
//   (Escape / "Exit zoom") comes back here with the zoomed range intact.
//
// The pointer and the keyboard drive the same cursor, so selecting a range never requires dragging,
// satisfying WCAG 2.5.7 (Dragging movements). Whether a zoom is applied is tracked separately by
// `zoomedExtremes`, since zoom mode can be entered on top of an existing zoom.
type ZoomModeState = "idle" | "zoomMode" | "selecting" | "zoomed";

// Fill for the in-progress zoom selection band: the "active" step of the selected-item background
// family, one shade stronger than the zoomed-range tint, so the range being selected reads as the more
// prominent of the two whenever both are on screen at once.
const ZOOM_SELECTION_FILL = colorBackgroundButtonNormalActive;

// Draws (or redraws) the zoom selection highlight band between two x-axis values. The band has no
// border of its own: the vertical divider lines mark its edges. It is drawn above the plot content, so
// the stylesheet gives it a partial fill opacity to keep the series and grid lines underneath visible.
function drawSelectionBand(
  xAxis: { removePlotBand(id: string): void; addPlotBand(options: object): void },
  from: number,
  to: number,
): void {
  xAxis.removePlotBand(ZOOM_SELECTION_BAND_ID);
  xAxis.addPlotBand({
    id: ZOOM_SELECTION_BAND_ID,
    from: Math.min(from, to),
    to: Math.max(from, to),
    color: ZOOM_SELECTION_FILL,
    className: styles["zoom-selection-band"],
    zIndex: 4,
  });
}

// Draws (or redraws) the vertical zoom cursor line at the given x-axis value. The cursor is the
// selection line that both the mouse and the keyboard move around while in zoom mode. It uses the
// shared zoom divider style so the selection line matches the range boundary dividers exactly.
function drawCursorLine(
  xAxis: { removePlotLine(id: string): void; addPlotLine(options: object): void },
  value: number,
): void {
  xAxis.removePlotLine(ZOOM_CURSOR_LINE_ID);
  xAxis.addPlotLine({
    id: ZOOM_CURSOR_LINE_ID,
    value,
    color: ZOOM_DIVIDER_COLOR,
    width: ZOOM_DIVIDER_WIDTH,
    zIndex: 6,
  });
}

// Type covering the subset of the Highcharts x-axis used to draw the zoom overlays.
interface ZoomOverlayAxis {
  removePlotBand(id: string): void;
  addPlotBand(options: object): void;
  removePlotLine(id: string): void;
  addPlotLine(options: object): void;
  toValue(pixel: number, paneCoordinates?: boolean): number;
}

// Fill for the zoom-range affordance band. This is the subtle selected-item background tint, laid
// under the plot content between the two boundary lines so the zoomed region reads as "selected".
const ZOOM_RANGE_FILL = colorBackgroundItemSelected;

// Draws (or redraws) the persistent zoom-range affordance: a subtle band tint between the zoomed
// min/max plus a vertical boundary line at each edge. Shown while the chart is zoomed to make the
// active range explicit. Boundary lines use the shared zoom divider style to match the tint.
function drawZoomRangeBoundaries(xAxis: ZoomOverlayAxis, min: number, max: number): void {
  clearZoomRangeBoundaries(xAxis);
  const from = Math.min(min, max);
  const to = Math.max(min, max);
  xAxis.addPlotBand({ id: ZOOM_RANGE_BAND_ID, from, to, color: ZOOM_RANGE_FILL, zIndex: 0 });
  for (const [id, value] of [
    [ZOOM_RANGE_START_LINE_ID, from],
    [ZOOM_RANGE_END_LINE_ID, to],
  ] as const) {
    xAxis.addPlotLine({ id, value, color: ZOOM_DIVIDER_COLOR, width: ZOOM_DIVIDER_WIDTH, zIndex: 3 });
  }
}

// Draws (or redraws) a vertical divider at each edge of the native drag-to-zoom selection. Highcharts
// renders that selection as a filled rectangle with no border, so without these the drag would be the
// only way of selecting a range that has no lines marking where it starts and ends.
//
// The edges come from the marker rectangle Highcharts computed for this drag frame rather than from
// the raw pointer position, so the dividers line up with the fill they bound instead of drifting from
// it once Highcharts clamps the marker to the plot area.
function drawDragBoundaries(xAxis: ZoomOverlayAxis, startX: number, endX: number, plotLeft: number): void {
  clearDragBoundaries(xAxis);
  for (const [id, pixelX] of [
    [ZOOM_DRAG_START_LINE_ID, startX],
    [ZOOM_DRAG_END_LINE_ID, endX],
  ] as const) {
    // Plot lines are positioned by axis value, so convert from the marker's pixel edges. `toValue`
    // expects a value relative to the plot area, hence subtracting plotLeft.
    const value = xAxis.toValue(pixelX - plotLeft, true);
    // Above the selection marker (zIndex 7) so the dividers stay visible on top of its fill.
    xAxis.addPlotLine({ id, value, color: ZOOM_DIVIDER_COLOR, width: ZOOM_DIVIDER_WIDTH, zIndex: 8 });
  }
}

// Removes the drag-selection dividers. Safe to call when they are not present.
function clearDragBoundaries(xAxis: ZoomOverlayAxis): void {
  xAxis.removePlotLine(ZOOM_DRAG_START_LINE_ID);
  xAxis.removePlotLine(ZOOM_DRAG_END_LINE_ID);
}

// Removes the zoom-range affordance overlays. Safe to call when they are not present.
function clearZoomRangeBoundaries(xAxis: ZoomOverlayAxis): void {
  xAxis.removePlotBand(ZOOM_RANGE_BAND_ID);
  xAxis.removePlotLine(ZOOM_RANGE_START_LINE_ID);
  xAxis.removePlotLine(ZOOM_RANGE_END_LINE_ID);
}

// Returns the x value from `values` nearest to `target`, moved one step in `direction` when a step
// is requested. Used to move the zoom cursor between data points.
function stepXValue(values: number[], target: number, direction: -1 | 1): number {
  if (values.length === 0) {
    return target;
  }
  // Index of the value at or just past the target.
  let idx = values.findIndex((x) => x >= target);
  if (idx === -1) {
    idx = values.length - 1;
  }
  // If the target sits exactly on a data point, step to the neighbour; otherwise snap to the value
  // on the side we are moving toward.
  if (values[idx] === target) {
    idx += direction;
  } else if (direction === -1) {
    idx -= 1;
  }
  return values[Math.max(0, Math.min(values.length - 1, idx))];
}

// Highcharts' Pointer.normalize maps a DOM mouse event to chart-relative coordinates. It is not
// part of the public typings, so we access it through a narrow structural type.
interface PointerWithNormalize {
  normalize?: (e: MouseEvent) => { chartX: number; chartY: number };
}

function normalizePointerEvent(
  chart: { pointer: unknown },
  e: MouseEvent,
): { chartX: number; chartY: number } | undefined {
  return (chart.pointer as PointerWithNormalize).normalize?.(e);
}

// Applies a controlled zoom range to the given x-axis, and returns the extremes that were set. A
// missing range means the full data range, which Highcharts expresses as undefined extremes.
function applyControlledZoomRange(
  xAxis: Pick<Highcharts.Axis, "setExtremes">,
  zoomRange: undefined | null | CartesianChartProps.ZoomRange,
): { min: undefined | number; max: undefined | number } {
  const x = zoomRange?.x;
  const extremes = x
    ? { min: Math.min(x.startValue, x.endValue), max: Math.max(x.startValue, x.endValue) }
    : { min: undefined, max: undefined };
  xAxis.setExtremes(extremes.min, extremes.max);
  return extremes;
}

// Returns the x values of all visible data points that are within the axis extremes, sorted. The zoom
// cursor moves between these, so it only ever lands on a point the user can see.
function getVisibleXValues(chart: Highcharts.Chart): number[] {
  const xValues = new Set<number>();
  for (const series of getChartSeries(chart)) {
    if (series.visible) {
      for (const point of getSeriesData(series)) {
        xValues.add(point.x);
      }
    }
  }
  const { min, max } = chart.xAxis[0].getExtremes();
  return Array.from(xValues)
    .filter((x) => (min === undefined || x >= min) && (max === undefined || x <= max))
    .sort((a, b) => a - b);
}

export const InternalCartesianChart = forwardRef(
  ({ tooltip, ...props }: InternalCartesianChartProps, ref: React.Ref<CartesianChartProps.Ref>) => {
    const apiRef = useRef<null | CoreChartProps.ChartAPI>(null);
    const [chartReady, setChartReady] = useState(false);
    const [zoomMode, setZoomMode] = useState<ZoomModeState>("idle");
    const [zoomAnchor, setZoomAnchor] = useState<number | null>(null);
    // Extremes of the currently applied zoom, used to draw the persistent boundary affordance
    // (two vertical lines + band tint). Null whenever the chart is not zoomed. Mirrored to a ref so
    // event handlers and callbacks can read the latest value without being re-created each change.
    const [zoomedExtremes, setZoomedExtremes] = useState<{ min: number; max: number } | null>(null);
    const zoomedExtremesRef = useRef<{ min: number; max: number } | null>(null);
    zoomedExtremesRef.current = zoomedExtremes;
    const zoomAnchorRef = useRef<number | null>(null);
    zoomAnchorRef.current = zoomAnchor;

    const [liveAnnouncement, setLiveAnnouncement] = useState("");

    // Ref to the reset button so we can move focus to it after a zoom is applied, keeping
    // keyboard users oriented on the newly available control.
    const resetButtonRef = useRef<{ focus(): void } | null>(null);
    // Tracks the previous zoom-mode state so focus is only moved on the transition into "zoomed".
    const prevZoomModeRef = useRef<ZoomModeState>("idle");

    // Position of the vertical zoom cursor (x-axis value). Shared by mouse and keyboard. Rendered as
    // React state so the direction buttons re-position, and mirrored to a ref for the event handlers.
    const [cursorX, setCursorX] = useState<number | null>(null);
    const cursorXRef = useRef<number | null>(null);
    cursorXRef.current = cursorX;
    // Invisible element the direction buttons anchor to; positioned at the cursor line.
    const cursorTrackRef = useRef<HTMLDivElement | null>(null);
    // The direction buttons are shown whenever we are in zoom mode with a placed cursor.
    const inZoomSelection = (zoomMode === "zoomMode" || zoomMode === "selecting") && cursorX !== null;
    // First and last point the cursor can reach, captured when zoom mode is entered. The direction that
    // cannot move any further is disabled, rather than silently doing nothing.
    const [cursorRange, setCursorRange] = useState<null | { first: number; last: number }>(null);

    useControllableState(props.visibleSeries, props.onVisibleSeriesChange, undefined, {
      componentName: "CartesianChart",
      propertyName: "visibleSeries",
      changeHandlerName: "onVisibleSeriesChange",
    });
    const allSeriesIds = props.series.map((s) => getOptionsId(s));
    const [visibleSeriesLocal, setVisibleSeriesLocal] = useState(props.visibleSeries ?? allSeriesIds);
    const visibleSeriesState = props.visibleSeries ?? visibleSeriesLocal;
    const onVisibleSeriesChange: CoreChartProps["onVisibleItemsChange"] = ({ detail: { items } }) => {
      const visibleSeries = items.filter((i) => i.visible).map((i) => i.id);
      if (props.visibleSeries) {
        fireNonCancelableEvent(props.onVisibleSeriesChange, { visibleSeries });
      } else {
        setVisibleSeriesLocal(visibleSeries);
      }
    };

    // i18n with defaults. Memoized so its identity is stable across renders, keeping the zoom
    // callbacks (which depend on the announcement formatters) from being recreated each render.
    const i18nStrings = props.i18nStrings;
    const i18n = useMemo(
      () => ({
        enterZoomModeButtonText: i18nStrings?.enterZoomModeButtonText ?? "Zoom",
        enterZoomModeButtonAriaLabel: i18nStrings?.enterZoomModeButtonAriaLabel ?? "Enter zoom mode",
        exitZoomModeButtonText: i18nStrings?.exitZoomModeButtonText ?? "Exit zoom",
        exitZoomModeButtonAriaLabel: i18nStrings?.exitZoomModeButtonAriaLabel ?? "Exit zoom mode",
        resetZoomButtonText: i18nStrings?.resetZoomButtonText ?? "Reset",
        resetZoomButtonAriaLabel: i18nStrings?.resetZoomButtonAriaLabel ?? "Reset zoom to show full data range",
        zoomControlsAriaLabel: i18nStrings?.zoomControlsAriaLabel ?? "Chart zoom controls",
        zoomCursorPreviousButtonAriaLabel: i18nStrings?.zoomCursorPreviousButtonAriaLabel ?? "Move zoom cursor left",
        zoomCursorNextButtonAriaLabel: i18nStrings?.zoomCursorNextButtonAriaLabel ?? "Move zoom cursor right",
        zoomModeEnteredAnnouncementText:
          i18nStrings?.zoomModeEnteredAnnouncementText ??
          ((value: string) => `Zoom mode. Cursor at ${value}. Use arrow keys to move, Enter to set the start point.`),
        zoomCursorPositionAnnouncementText:
          i18nStrings?.zoomCursorPositionAnnouncementText ?? ((value: string) => value),
        zoomStartPointAnnouncementText:
          i18nStrings?.zoomStartPointAnnouncementText ??
          ((value: string) => `Start point set at ${value}. Move the cursor and set the end point to zoom.`),
        zoomRangeChangeAnnouncementText:
          i18nStrings?.zoomRangeChangeAnnouncementText ??
          ((startValue: string, endValue: string) => `Zoomed from ${startValue} to ${endValue}`),
        zoomSelectionAnnouncementText:
          i18nStrings?.zoomSelectionAnnouncementText ??
          ((startValue: string, endValue: string) => `Selecting zoom range from ${startValue} to ${endValue}`),
      }),
      [i18nStrings],
    );

    const zoomEnabled = !!props.zoom?.enabled;
    // Providing the zoomRange property puts the zoomed range under the consumer's control: the chart
    // then reports the ranges the user selects, but only zooms when the property changes.
    const isZoomRangeControlled = props.zoomRange !== undefined;

    // Formats an x-axis value for screen reader announcements, using the axis value formatter when provided,
    // then falling back to locale-aware datetime formatting, and finally to the raw string value.
    const formatXValue = useCallback(
      (value: number) => {
        const xAxisOptions = castArray(props.xAxis)?.[0];
        if (xAxisOptions?.valueFormatter) {
          return xAxisOptions.valueFormatter(value);
        }
        if (xAxisOptions?.type === "datetime") {
          return new Date(value).toLocaleString();
        }
        return String(value);
      },
      [props.xAxis],
    );

    const applyZoom = useCallback(
      (startValue: number, endValue: number) => {
        const min = Math.min(startValue, endValue);
        const max = Math.max(startValue, endValue);
        // In controlled mode the consumer owns the extremes: emit the event and let the
        // zoomRange prop drive the chart. In uncontrolled mode we apply the extremes directly.
        const xAxis = apiRef.current?.chart.xAxis[0];
        // Remove the zoom-mode overlays before applying the zoom.
        if (xAxis) {
          xAxis.removePlotBand(ZOOM_SELECTION_BAND_ID);
          xAxis.removePlotLine(ZOOM_ANCHOR_LINE_ID);
          xAxis.removePlotLine(ZOOM_CURSOR_LINE_ID);
        }
        if (props.zoomRange === undefined) {
          xAxis?.setExtremes(min, max);
          setZoomMode("zoomed");
          setZoomedExtremes({ min, max });
        }
        setZoomAnchor(null);
        setCursorX(null);
        setLiveAnnouncement(i18n.zoomRangeChangeAnnouncementText(formatXValue(min), formatXValue(max)));
        fireNonCancelableEvent(props.onZoomRangeChange, { zoomRange: { x: { startValue: min, endValue: max } } });
      },
      [formatXValue, i18n, props.onZoomRangeChange, props.zoomRange],
    );

    const resetZoom = useCallback(() => {
      if (props.zoomRange === undefined) {
        apiRef.current?.chart.xAxis[0].setExtremes(undefined, undefined);
        setZoomMode("idle");
        setZoomedExtremes(null);
      }
      setZoomAnchor(null);
      fireNonCancelableEvent(props.onZoomRangeChange, { zoomRange: null });
    }, [props.onZoomRangeChange, props.zoomRange]);

    // Focus management: when the chart transitions into the zoomed state, move focus to the
    // "Reset" button so keyboard and screen reader users land on the control that just appeared.
    useEffect(() => {
      if (prevZoomModeRef.current !== "zoomed" && zoomMode === "zoomed" && !props.zoom?.hideButtons) {
        resetButtonRef.current?.focus();
      }
      prevZoomModeRef.current = zoomMode;
    }, [zoomMode, props.zoom?.hideButtons]);

    // Controlled zoom range: the consumer owns the range, so the chart follows the zoomRange property.
    useEffect(() => {
      if (chartReady && apiRef.current && isZoomRangeControlled) {
        const { min, max } = applyControlledZoomRange(apiRef.current.chart.xAxis[0], props.zoomRange);
        setZoomMode(min === undefined ? "idle" : "zoomed");
        setZoomedExtremes(min === undefined || max === undefined ? null : { min, max });
      }
    }, [chartReady, isZoomRangeControlled, props.zoomRange]);

    // Keep the element the direction buttons are anchored to aligned with the cursor line, at the
    // bottom of the plot area.
    useEffect(() => {
      const chart = apiRef.current?.chart;
      if (!chart || !cursorTrackRef.current || cursorX === null || !inZoomSelection) {
        return;
      }
      // toPixels returns a left-to-right offset, so it is applied as a physical inset: an inline inset
      // would be measured from the opposite edge in right-to-left rendering.
      cursorTrackRef.current.style.left = `${chart.xAxis[0].toPixels(cursorX, false)}px`;
      cursorTrackRef.current.style.top = `${chart.plotTop + chart.plotHeight}px`;
    }, [cursorX, inZoomSelection]);

    const enterZoomMode = useCallback(() => {
      const chart = apiRef.current?.chart;
      const visibleXValues = chart ? getVisibleXValues(chart) : [];
      // Start the cursor on the first visible point so it has an immediate, visible anchor without the
      // user having to hover the chart first.
      const initialX = visibleXValues[0] ?? chart?.xAxis[0].getExtremes().min ?? null;
      setZoomMode("zoomMode");
      setZoomAnchor(null);
      setCursorX(initialX);
      setCursorRange(
        visibleXValues.length > 0
          ? { first: visibleXValues[0], last: visibleXValues[visibleXValues.length - 1] }
          : null,
      );
      setLiveAnnouncement(initialX !== null ? i18n.zoomModeEnteredAnnouncementText(formatXValue(initialX)) : "");
    }, [formatXValue, i18n]);

    const exitZoomMode = useCallback(() => {
      // Exiting zoom mode cancels the in-progress selection but preserves any zoom already applied:
      // return to "zoomed" when extremes are still in effect, otherwise back to "idle".
      setZoomMode(zoomedExtremesRef.current ? "zoomed" : "idle");
      setZoomAnchor(null);
      setCursorX(null);
      setLiveAnnouncement("");
    }, []);

    // Moves the zoom cursor to an absolute x value, shared by the pointer, the arrow keys, and the
    // direction buttons. Only updates state — the cursor line and selection band are drawn declaratively by an
    // effect, so they survive Highcharts re-renders (e.g. when zoom mode toggles the tooltip).
    const moveCursorTo = useCallback(
      (value: number, options: { announce?: boolean } = {}) => {
        setCursorX(value);
        if (options.announce) {
          setLiveAnnouncement(
            zoomAnchorRef.current !== null
              ? i18n.zoomSelectionAnnouncementText(
                  formatXValue(Math.min(zoomAnchorRef.current, value)),
                  formatXValue(Math.max(zoomAnchorRef.current, value)),
                )
              : i18n.zoomCursorPositionAnnouncementText(formatXValue(value)),
          );
        }
      },
      [formatXValue, i18n],
    );

    // Steps the zoom cursor one data point towards the inline start (-1) or end (+1), driven by the
    // arrow keys and the direction buttons.
    const stepCursor = useCallback(
      (direction: -1 | 1) => {
        const chart = apiRef.current?.chart;
        if (!chart || cursorXRef.current === null) {
          return;
        }
        const next = stepXValue(getVisibleXValues(chart), cursorXRef.current, direction);
        moveCursorTo(next, { announce: true });
      },
      [moveCursorTo],
    );

    // Sets the current zoom point: the first call sets the anchor, the second applies the zoom.
    // An explicit value can be passed (e.g. from a click) since state updates are not yet flushed.
    const commitPoint = useCallback(
      (explicitValue?: number) => {
        const value = explicitValue ?? cursorXRef.current;
        if (value === null) {
          return;
        }
        if (zoomAnchorRef.current === null) {
          // First point → set the anchor.
          setZoomAnchor(value);
          setZoomMode("selecting");
          setLiveAnnouncement(i18n.zoomStartPointAnnouncementText(formatXValue(value)));
        } else if (value !== zoomAnchorRef.current) {
          // Second point → apply the zoom.
          applyZoom(zoomAnchorRef.current, value);
        }
      },
      [applyZoom, formatXValue, i18n],
    );

    // True while a range is being selected inside the chart (zoom mode entered, with or without a
    // start point placed yet), as opposed to dragging or the settled idle/zoomed states.
    const isSelectingZoom = zoomMode === "zoomMode" || zoomMode === "selecting";

    // Declaratively draw the zoom-mode overlays (cursor line, anchor line, selection band) from
    // state. Runs after every render so the overlays are re-applied whenever Highcharts updates the
    // chart (which clears imperatively-added plot lines/bands).
    useEffect(() => {
      const xAxis = apiRef.current?.chart.xAxis[0];
      if (!xAxis) {
        return;
      }
      xAxis.removePlotLine(ZOOM_CURSOR_LINE_ID);
      xAxis.removePlotLine(ZOOM_ANCHOR_LINE_ID);
      xAxis.removePlotBand(ZOOM_SELECTION_BAND_ID);
      if (zoomMode !== "zoomMode" && zoomMode !== "selecting") {
        return;
      }
      if (zoomAnchor !== null) {
        xAxis.addPlotLine({
          id: ZOOM_ANCHOR_LINE_ID,
          value: zoomAnchor,
          color: ZOOM_DIVIDER_COLOR,
          width: ZOOM_DIVIDER_WIDTH,
          zIndex: 5,
        });
      }
      if (cursorX !== null) {
        drawCursorLine(xAxis, cursorX);
        if (zoomAnchor !== null) {
          drawSelectionBand(xAxis, zoomAnchor, cursorX);
        }
      }
    }, [zoomMode, cursorX, zoomAnchor, chartReady]);

    // Declaratively draw the persistent zoom-range affordance (boundary lines + band tint) from
    // state. Like the cursor-overlay effect above, it runs after every render so the overlays are
    // re-applied whenever Highcharts updates the chart (which clears imperatively-added lines/bands).
    // The affordance stays visible while zoom mode is re-entered on top of an existing zoom: the
    // selection band is the stronger shade of the same tint, so it reads as a range being picked
    // inside the range already in view.
    useEffect(() => {
      const xAxis = apiRef.current?.chart.xAxis[0];
      if (!xAxis) {
        return;
      }
      if (zoomedExtremes) {
        drawZoomRangeBoundaries(xAxis, zoomedExtremes.min, zoomedExtremes.max);
      } else {
        clearZoomRangeBoundaries(xAxis);
      }
    }, [zoomedExtremes, chartReady]);

    // Drag-to-zoom: mirror the selection dividers onto the native drag selection. Highcharts draws
    // that selection as a bare filled rectangle, so we track the drag ourselves and draw a vertical
    // line at each edge, matching what a click/keyboard selection shows. Active whenever zoom is
    // enabled and no in-chart selection is in progress, since dragging works outside zoom mode too.
    useEffect(() => {
      if (!zoomEnabled || !chartReady || !apiRef.current || isSelectingZoom) {
        return;
      }
      const chart = apiRef.current.chart;
      const highcharts = apiRef.current.highcharts;
      const xAxis = chart.xAxis[0];

      // Highcharts fires "getSelectionMarkerAttrs" once per drag frame with the rectangle it is about
      // to give the selection marker, so the drag threshold and the clamping to the plot area are
      // already applied by the time we see it. A plain click never reaches this event, so it never
      // flashes a pair of dividers.
      //
      // Listeners run before the default handler that fills in `attrs`, so the rectangle is only
      // readable once the event has finished dispatching — hence reading it back on a microtask.
      const pointer = chart.pointer;
      let disposed = false;
      const removeDragListener = highcharts.addEvent(pointer, "getSelectionMarkerAttrs", (e: unknown) => {
        const { attrs } = e as { attrs?: { x?: number; width?: number } };
        Promise.resolve().then(() => {
          if (disposed || typeof attrs?.x !== "number" || typeof attrs?.width !== "number") {
            return;
          }
          drawDragBoundaries(xAxis, attrs.x, attrs.x + attrs.width, chart.plotLeft);
        });
      });

      // The selection marker is destroyed when the drag ends, whether or not a zoom was applied.
      const removeDropListener = highcharts.addEvent(chart, "selection", () => clearDragBoundaries(xAxis));
      const onMouseUp = () => clearDragBoundaries(xAxis);
      document.addEventListener("mouseup", onMouseUp);

      return () => {
        disposed = true;
        document.removeEventListener("mouseup", onMouseUp);
        // Highcharts may already have destroyed the chart by the time this runs (it nulls out the
        // pointer and the axes), and reaching into the remains to detach listeners or clear plot
        // lines throws. Nothing needs cleaning up in that case: the chart took the overlays with it.
        if (!chart.pointer) {
          return;
        }
        removeDragListener();
        removeDropListener();
        clearDragBoundaries(xAxis);
      };
    }, [zoomEnabled, chartReady, isSelectingZoom]);

    // Zoom mode: click handling and mouse tracking on the chart container.
    useEffect(() => {
      if (!zoomEnabled || !chartReady || !apiRef.current) {
        return;
      }
      if (zoomMode !== "zoomMode" && zoomMode !== "selecting") {
        return;
      }

      const chart = apiRef.current.chart;
      const xAxis = chart.xAxis[0];
      const container = chart.container;

      const isInsidePlotX = (chartX: number) => chartX >= chart.plotLeft && chartX <= chart.plotLeft + chart.plotWidth;

      // Show a grabbing cursor while a range is being selected, matching the affordance the chart uses
      // for dragging elsewhere. The chart sets the cursor imperatively as the pointer moves, so this is
      // re-applied on each move rather than left to the stylesheet.
      const applyZoomModeCursor = () => {
        container.style.cursor = zoomAnchorRef.current === null ? "grab" : "grabbing";
      };

      // Mouse move: the cursor (and, while selecting, the highlight band) follows the pointer.
      const onMouseMove = (e: MouseEvent) => {
        const normalized = normalizePointerEvent(chart, e);
        if (!normalized || !isInsidePlotX(normalized.chartX)) {
          return;
        }
        // The chart tracks the pointer to highlight the nearest group, which draws a cursor line of
        // its own and sets the cursor style. Disabling the tooltip does not stop it, so clear the
        // highlight here: otherwise it trails the zoom cursor as a second, grey line snapped to the
        // nearest data point, and the pointer keeps the "pointer" style used to indicate a tooltip.
        apiRef.current?.clearChartHighlight();
        applyZoomModeCursor();
        moveCursorTo(xAxis.toValue(normalized.chartX, false));
      };

      // Click: set the start or end point at the pointer position.
      const onClick = (e: MouseEvent) => {
        const normalized = normalizePointerEvent(chart, e);
        if (!normalized) {
          return;
        }
        const { chartX, chartY } = normalized;
        const insideY = chartY >= chart.plotTop && chartY <= chart.plotTop + chart.plotHeight;
        if (!isInsidePlotX(chartX) || !insideY) {
          return;
        }
        const value = xAxis.toValue(chartX, false);
        moveCursorTo(value);
        commitPoint(value);
      };

      // Keyboard: arrows move the cursor, Enter/Space set a point, Escape cancels zoom mode.
      const onKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
          case "ArrowRight":
            e.preventDefault();
            stepCursor(1);
            break;
          case "ArrowLeft":
            e.preventDefault();
            stepCursor(-1);
            break;
          case "Enter":
          case " ":
            e.preventDefault();
            commitPoint();
            break;
          case "Escape":
            e.preventDefault();
            exitZoomMode();
            break;
        }
      };

      // Delay the click listener so the button click that entered zoom mode doesn't set a point.
      const timeoutId = setTimeout(() => {
        container.addEventListener("click", onClick);
      }, 0);
      container.addEventListener("mousemove", onMouseMove);
      document.addEventListener("keydown", onKeyDown);
      applyZoomModeCursor();

      return () => {
        clearTimeout(timeoutId);
        container.removeEventListener("click", onClick);
        container.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("keydown", onKeyDown);
        // Hand the cursor back to the chart, which sets it as the pointer moves over the series.
        container.style.cursor = "";
      };
    }, [zoomEnabled, chartReady, zoomMode, moveCursorTo, stepCursor, commitPoint, exitZoomMode]);

    // Tooltip content transformation.
    const getTooltipContent: CoreChartProps["getTooltipContent"] = () => {
      const transformItem = (item: CoreChartProps.TooltipContentItem): CartesianChartProps.TooltipPointItem => {
        const userOptions = item.point.series.userOptions as NonErrorBarSeriesOptions;
        const originalType = item.point.series.userOptions.custom?.awsui?.type;
        const series = originalType
          ? ({ ...userOptions, type: originalType } as NonErrorBarSeriesOptions)
          : userOptions;
        return {
          x: item.point.x,
          y: isXThreshold(item.point.series) ? null : (item.point.y ?? null),
          size: item.point.options.z ?? undefined,
          series,
          errorRanges: item.errorRanges.map((point) => ({
            low: point.options.low ?? 0,
            high: point.options.high ?? 0,
            series: point.series.userOptions as ErrorBarSeriesOptions,
          })),
        };
      };
      const transformSeriesProps = (
        props: CoreChartProps.TooltipPointProps,
      ): CartesianChartProps.TooltipPointRenderProps => ({ item: transformItem(props.item) });
      const transformSlotProps = (
        props: CoreChartProps.TooltipSlotProps,
      ): CartesianChartProps.TooltipSlotRenderProps => ({ x: props.x, items: props.items.map(transformItem) });

      return {
        point: tooltip.point ? (coreProps) => tooltip.point!(transformSeriesProps(coreProps)) : undefined,
        header: tooltip.header ? (coreProps) => tooltip.header!(transformSlotProps(coreProps)) : undefined,
        body: tooltip.body ? (coreProps) => tooltip.body!(transformSlotProps(coreProps)) : undefined,
        footer: tooltip.footer ? (coreProps) => tooltip.footer!(transformSlotProps(coreProps)) : undefined,
      };
    };

    const { series, xPlotLines, yPlotLines } = transformCartesianSeries(props.series, visibleSeriesState);

    useImperativeHandle(ref, () => ({
      setVisibleSeries: (visibleSeriesIds) => apiRef.current?.setItemsVisible(visibleSeriesIds),
      showAllSeries: () => apiRef.current?.setItemsVisible(allSeriesIds),
      enterZoomMode,
      exitZoomMode,
      resetZoom,
    }));

    // The zoom mode button rendered inside the chart plot area (top-right corner).
    const zoomModeButton =
      zoomEnabled && !props.zoom?.hideButtons ? (
        <div className={styles["zoom-controls"]} role="region" aria-label={i18n.zoomControlsAriaLabel}>
          <LiveRegion hidden={true}>{liveAnnouncement}</LiveRegion>
          {/* Reset (shown while zoomed) and Zoom sit side by side; Reset leads so the Zoom button
              keeps its position whether or not the chart is zoomed. During an active selection only
              the "Exit zoom" button is shown. */}
          <SpaceBetween size="s" direction="horizontal">
            {zoomMode === "zoomed" && (
              <span className={testClasses["reset-zoom-button"]}>
                <Button
                  ref={resetButtonRef}
                  variant="link"
                  onClick={resetZoom}
                  ariaLabel={i18n.resetZoomButtonAriaLabel}
                >
                  {i18n.resetZoomButtonText}
                </Button>
              </span>
            )}
            {(zoomMode === "idle" || zoomMode === "zoomed") && (
              <span className={testClasses["zoom-button"]}>
                <Button
                  variant="normal"
                  iconName="search"
                  onClick={enterZoomMode}
                  ariaLabel={i18n.enterZoomModeButtonAriaLabel}
                >
                  {i18n.enterZoomModeButtonText}
                </Button>
              </span>
            )}
            {(zoomMode === "zoomMode" || zoomMode === "selecting") && (
              <span className={testClasses["exit-zoom-button"]}>
                <Button
                  variant="primary"
                  iconName="search"
                  onClick={exitZoomMode}
                  ariaLabel={i18n.exitZoomModeButtonAriaLabel}
                >
                  {i18n.exitZoomModeButtonText}
                </Button>
              </span>
            )}
          </SpaceBetween>
        </div>
      ) : null;

    // The tooltip is suppressed while a range is being selected: it would sit under the pointer and
    // compete with the selection.
    const effectiveTooltip = isSelectingZoom ? { ...tooltip, enabled: false } : tooltip;

    return (
      <>
        <InternalCoreChart
          {...props}
          navigator={zoomModeButton}
          callback={(api) => {
            apiRef.current = api;
            setChartReady(true);
            // Move the cursor-tracking element into the chart container, so the direction buttons can be
            // positioned relative to the plot through the portal overlay.
            if (cursorTrackRef.current && !api.chart.container.contains(cursorTrackRef.current)) {
              api.chart.container.style.position = "relative";
              api.chart.container.appendChild(cursorTrackRef.current);
            }
          }}
          options={{
            chart: {
              inverted: props.inverted,
              ...(zoomEnabled
                ? {
                    zooming: { type: "x" },
                    // Match the drag-to-zoom marker to the click/keyboard selection band, so both
                    // ways of selecting a range look the same. Highcharts would otherwise use its
                    // own highlight color here.
                    selectionMarkerFill: ZOOM_SELECTION_FILL,
                    resetZoomButton: { theme: { style: { display: "none" } } },
                  }
                : {}),
            },
            plotOptions: { series: { stacking: props.stacking } },
            accessibility: { enabled: true, keyboardNavigation: { enabled: true } },
            series,
            xAxis: castArray(props.xAxis)?.map((xAxisProps) => ({
              ...xAxisProps,
              title: { text: xAxisProps.title },
              plotLines: xPlotLines,
              ...(zoomEnabled
                ? {
                    events: {
                      afterSetExtremes(e: {
                        min: number;
                        max: number;
                        trigger?: string;
                        userMin?: number;
                        userMax?: number;
                      }) {
                        if (e.trigger !== "zoom") {
                          return;
                        }
                        const zoomed = !!(e.userMin || e.userMax);
                        // Dragging across the plot makes Highcharts apply the extremes itself. In
                        // controlled mode the range belongs to the consumer, so the drag is reported
                        // and then undone, leaving the zoomRange property to drive the chart.
                        if (isZoomRangeControlled) {
                          fireNonCancelableEvent(props.onZoomRangeChange, {
                            zoomRange: zoomed ? { x: { startValue: e.min, endValue: e.max } } : null,
                          });
                          applyControlledZoomRange(this, props.zoomRange);
                          return;
                        }
                        if (zoomed) {
                          setZoomMode("zoomed");
                          setZoomedExtremes({ min: e.min, max: e.max });
                          setLiveAnnouncement(
                            i18n.zoomRangeChangeAnnouncementText(formatXValue(e.min), formatXValue(e.max)),
                          );
                          fireNonCancelableEvent(props.onZoomRangeChange, {
                            zoomRange: { x: { startValue: e.min, endValue: e.max } },
                          });
                        } else {
                          setZoomedExtremes(null);
                          fireNonCancelableEvent(props.onZoomRangeChange, { zoomRange: null });
                        }
                      },
                    },
                  }
                : {}),
            })),
            yAxis: castArray(props.yAxis)?.map((yAxisProps, index) => ({
              ...yAxisProps,
              title: { text: yAxisProps.title },
              plotLines: yPlotLines,
              ...(index === 1 ? { opposite: true } : {}),
            })),
          }}
          sizeAxis={props.sizeAxis}
          tooltip={effectiveTooltip}
          getTooltipContent={getTooltipContent}
          visibleItems={props.visibleSeries}
          onVisibleItemsChange={onVisibleSeriesChange}
          className={testClasses.root}
        />
        {/* Zero-size element the buttons overlay is anchored to, kept in sync with the cursor line. */}
        <div ref={cursorTrackRef} aria-hidden="true" className={styles["zoom-cursor-track"]} />
        {/* Pointer and touch alternative for moving the zoom cursor, for users who cannot drag. */}
        <PortalOverlay track={cursorTrackRef} isDisabled={!inZoomSelection}>
          {inZoomSelection && (
            <>
              <DirectionButton
                direction="inline-start"
                ariaLabel={i18n.zoomCursorPreviousButtonAriaLabel}
                disabled={cursorRange !== null && cursorX !== null && cursorX <= cursorRange.first}
                onClick={() => stepCursor(-1)}
              />
              <DirectionButton
                direction="inline-end"
                ariaLabel={i18n.zoomCursorNextButtonAriaLabel}
                disabled={cursorRange !== null && cursorX !== null && cursorX >= cursorRange.last}
                onClick={() => stepCursor(1)}
              />
            </>
          )}
        </PortalOverlay>
      </>
    );
  },
);
