// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

import { useControllableState } from "@cloudscape-design/component-toolkit";
import Button from "@cloudscape-design/components/button";
import LiveRegion from "@cloudscape-design/components/live-region";
import {
  colorBackgroundItemSelected,
  colorBorderItemFocused,
  colorBorderItemSelected,
  colorChartsLineTick,
} from "@cloudscape-design/design-tokens";

import { InternalCoreChart } from "../core/chart-core";
import { CoreChartProps, ErrorBarSeriesOptions } from "../core/interfaces";
import { getOptionsId, isXThreshold } from "../core/utils";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
import DirectionButton from "../internal/components/drag-handle-wrapper/direction-button";
import PortalOverlay from "../internal/components/drag-handle-wrapper/portal-overlay";
import { fireNonCancelableEvent } from "../internal/events";
import { castArray, SomeRequired } from "../internal/utils/utils";
import { transformCartesianSeries } from "./chart-series-cartesian";
import { CartesianChartProps, NonErrorBarSeriesOptions } from "./interfaces";

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

// Zoom mode state machine:
// "idle" — normal chart, "Zoom" button visible.
// "zoomMode" — zoom mode entered, "Exit zoom" button visible, popovers disabled. A vertical cursor
//   follows the mouse or arrow keys, waiting for the first point (click / Enter / Space).
// "selecting" — first point set, highlight band spans from the anchor to the cursor, waiting for the
//   second point (click / Enter / Space) to complete the zoom.
// "zoomed" — chart is zoomed, "Reset" button visible.
// Both the mouse and the keyboard drive the same cursor, so the two interaction methods are unified
// (matching the approved design) and each is a WCAG-compliant single-pointer / keyboard equivalent.
type ZoomModeState = "idle" | "zoomMode" | "selecting" | "zoomed";

// Fill for the keyboard/click zoom selection band. This matches the fill Highcharts applies to its
// native drag-to-zoom selection marker (highlightColor80 at 0.25 opacity), so keyboard and
// click-based selection look identical to standard mouse dragging.
const ZOOM_SELECTION_FILL = "rgba(51, 78, 255, 0.25)";

// Draws (or redraws) the zoom selection highlight band between two x-axis values. It intentionally
// mirrors the native Highcharts drag-selection marker: a translucent fill with no border.
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
    zIndex: 4,
  });
}

// Draws (or redraws) the vertical zoom cursor line at the given x-axis value. The cursor is the
// shared focus indicator that both the mouse and the keyboard move around while in zoom mode. It
// reuses the same look as the standard chart hover cursor (see Styles.cursorLine).
function drawCursorLine(
  xAxis: { removePlotLine(id: string): void; addPlotLine(options: object): void },
  value: number,
): void {
  xAxis.removePlotLine(ZOOM_CURSOR_LINE_ID);
  xAxis.addPlotLine({
    id: ZOOM_CURSOR_LINE_ID,
    value,
    color: colorChartsLineTick,
    width: 1,
    zIndex: 6,
  });
}

// Type covering the subset of the Highcharts x-axis used to draw the zoom overlays.
interface ZoomOverlayAxis {
  removePlotBand(id: string): void;
  addPlotBand(options: object): void;
  removePlotLine(id: string): void;
  addPlotLine(options: object): void;
}

// Fill for the zoom-range affordance band. This is the subtle selected-item background tint, laid
// under the plot content between the two boundary lines so the zoomed region reads as "selected".
const ZOOM_RANGE_FILL = colorBackgroundItemSelected;

// Draws (or redraws) the persistent zoom-range affordance: a subtle band tint between the zoomed
// min/max plus a vertical boundary line at each edge. Shown while the chart is zoomed to make the
// active range explicit. Boundary lines reuse the selected-item border token to match the tint.
function drawZoomRangeBoundaries(xAxis: ZoomOverlayAxis, min: number, max: number): void {
  clearZoomRangeBoundaries(xAxis);
  const from = Math.min(min, max);
  const to = Math.max(min, max);
  xAxis.addPlotBand({ id: ZOOM_RANGE_BAND_ID, from, to, color: ZOOM_RANGE_FILL, zIndex: 0 });
  for (const [id, value] of [
    [ZOOM_RANGE_START_LINE_ID, from],
    [ZOOM_RANGE_END_LINE_ID, to],
  ] as const) {
    xAxis.addPlotLine({ id, value, color: colorBorderItemSelected, width: 1, zIndex: 3 });
  }
}

// Removes the zoom-range affordance overlays. Safe to call when they are not present.
function clearZoomRangeBoundaries(xAxis: ZoomOverlayAxis): void {
  xAxis.removePlotBand(ZOOM_RANGE_BAND_ID);
  xAxis.removePlotLine(ZOOM_RANGE_START_LINE_ID);
  xAxis.removePlotLine(ZOOM_RANGE_END_LINE_ID);
}

// Returns the x value from `values` nearest to `target`, moved one step in `direction` when a step
// is requested. Used to move the zoom cursor between real data points via arrow keys / UAP buttons.
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

function getChartXValues(chart: {
  series: readonly { visible: boolean; points?: readonly { x: number }[] }[];
}): number[] {
  const xSet = new Set<number>();
  for (const s of chart.series) {
    if (!s.visible) {
      continue;
    }
    for (const p of s.points ?? []) {
      xSet.add(p.x);
    }
  }
  return Array.from(xSet).sort((a, b) => a - b);
}

export const InternalCartesianChart = forwardRef(
  ({ tooltip, ...props }: InternalCartesianChartProps, ref: React.Ref<CartesianChartProps.Ref>) => {
    const apiRef = useRef<null | CoreChartProps.ChartAPI>(null);
    const [chartReady, setChartReady] = useState(false);
    const [zoomMode, setZoomMode] = useState<ZoomModeState>("idle");
    const [zoomAnchor, setZoomAnchor] = useState<number | null>(null);
    // Extremes of the currently applied zoom, used to draw the persistent boundary affordance
    // (two vertical lines + band tint). Null whenever the chart is not zoomed.
    const [zoomedExtremes, setZoomedExtremes] = useState<{ min: number; max: number } | null>(null);
    const zoomAnchorRef = useRef<number | null>(null);
    zoomAnchorRef.current = zoomAnchor;

    const [liveAnnouncement, setLiveAnnouncement] = useState("");

    // Ref to the reset button so we can move focus to it after a zoom is applied, keeping
    // keyboard users oriented on the newly available control.
    const resetButtonRef = useRef<{ focus(): void } | null>(null);
    // Tracks the previous zoom-mode state so focus is only moved on the transition into "zoomed".
    const prevZoomModeRef = useRef<ZoomModeState>("idle");

    // Position of the vertical zoom cursor (x-axis value). Shared by mouse and keyboard. Rendered as
    // React state so the UAP direction buttons re-position, and mirrored to a ref for event handlers.
    const [cursorX, setCursorX] = useState<number | null>(null);
    const cursorXRef = useRef<number | null>(null);
    cursorXRef.current = cursorX;
    // Invisible element the UAP direction buttons anchor to; positioned at the cursor line.
    const cursorTrackRef = useRef<HTMLDivElement | null>(null);
    // The direction buttons are shown whenever we are in zoom mode with a placed cursor.
    const inZoomSelection = (zoomMode === "zoomMode" || zoomMode === "selecting") && cursorX !== null;

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

    // Controlled zoom range: apply external zoomRange prop to the chart.
    useEffect(() => {
      if (!chartReady || !apiRef.current) {
        return;
      }
      const xAxis = apiRef.current.chart.xAxis[0];
      if (props.zoomRange === undefined) {
        // Uncontrolled mode — do nothing.
        return;
      }
      if (props.zoomRange === null) {
        // Reset to full range.
        xAxis.setExtremes(undefined, undefined);
        setZoomMode("idle");
        setZoomedExtremes(null);
      } else if (props.zoomRange.x) {
        // Apply the controlled range.
        const { startValue, endValue } = props.zoomRange.x;
        xAxis.setExtremes(startValue, endValue);
        setZoomMode("zoomed");
        setZoomedExtremes({ min: Math.min(startValue, endValue), max: Math.max(startValue, endValue) });
      }
    }, [chartReady, props.zoomRange]);

    // Keep the cursor-tracking element (and therefore the UAP direction buttons) aligned with the
    // cursor line at the bottom of the plot area.
    useEffect(() => {
      const chart = apiRef.current?.chart;
      if (!chart || !cursorTrackRef.current || cursorX === null || !inZoomSelection) {
        return;
      }
      const pixelX = chart.xAxis[0].toPixels(cursorX, false);
      cursorTrackRef.current.style.insetInlineStart = `${pixelX}px`;
      cursorTrackRef.current.style.insetBlockStart = `${chart.plotTop + chart.plotHeight}px`;
    }, [cursorX, inZoomSelection]);

    const enterZoomMode = useCallback(() => {
      const chart = apiRef.current?.chart;
      // Start the cursor at the first data point (or the current axis min) so keyboard users have an
      // immediate, visible anchor without needing to hover first.
      const xValues = chart ? getChartXValues(chart) : [];
      const initialX = xValues[0] ?? chart?.xAxis[0].getExtremes().min ?? null;
      setZoomMode("zoomMode");
      setZoomAnchor(null);
      setCursorX(initialX);
      setLiveAnnouncement(initialX !== null ? i18n.zoomModeEnteredAnnouncementText(formatXValue(initialX)) : "");
    }, [formatXValue, i18n]);

    const exitZoomMode = useCallback(() => {
      setZoomMode("idle");
      setZoomAnchor(null);
      setCursorX(null);
      setLiveAnnouncement("");
    }, []);

    // Moves the zoom cursor to an absolute x value (shared by mouse hover, arrow keys, and UAP
    // buttons). Only updates state — the cursor line and selection band are drawn declaratively by an
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

    // Steps the zoom cursor one data point left (-1) or right (+1) via arrow keys / UAP buttons.
    const stepCursor = useCallback(
      (direction: -1 | 1) => {
        const chart = apiRef.current?.chart;
        if (!chart || cursorXRef.current === null) {
          return;
        }
        const xValues = getChartXValues(chart);
        const next = stepXValue(xValues, cursorXRef.current, direction);
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
          color: colorBorderItemFocused,
          width: 2,
          dashStyle: "Dash",
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

      // Mouse move: the cursor (and, while selecting, the highlight band) follows the pointer.
      const onMouseMove = (e: MouseEvent) => {
        const normalized = normalizePointerEvent(chart, e);
        if (!normalized || !isInsidePlotX(normalized.chartX)) {
          return;
        }
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

      return () => {
        clearTimeout(timeoutId);
        container.removeEventListener("click", onClick);
        container.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("keydown", onKeyDown);
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
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 10,
          }}
          role="region"
          aria-label={i18n.zoomControlsAriaLabel}
        >
          <LiveRegion hidden={true}>{liveAnnouncement}</LiveRegion>
          {zoomMode === "idle" && (
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
          {zoomMode === "zoomed" && (
            <span className={testClasses["reset-zoom-button"]}>
              <Button
                ref={resetButtonRef}
                variant="normal"
                onClick={resetZoom}
                ariaLabel={i18n.resetZoomButtonAriaLabel}
              >
                {i18n.resetZoomButtonText}
              </Button>
            </span>
          )}
        </div>
      ) : null;

    // Disable tooltip in zoom mode (popovers disabled).
    const effectiveTooltip =
      zoomMode === "zoomMode" || zoomMode === "selecting" ? { ...tooltip, enabled: false } : tooltip;

    return (
      <>
        <InternalCoreChart
          {...props}
          navigator={zoomModeButton}
          callback={(api) => {
            apiRef.current = api;
            setChartReady(true);
            // Move the cursor-tracking element into the chart container so the UAP direction buttons
            // can be positioned relative to the plot via the portal overlay.
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
                        if (e.trigger === "zoom") {
                          const zoomed = !!(e.userMin || e.userMax);
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
        {/* Invisible element tracked by the UAP direction buttons overlay, positioned at the cursor. */}
        <div
          ref={cursorTrackRef}
          aria-hidden="true"
          style={{ position: "absolute", inlineSize: 1, blockSize: 1, pointerEvents: "none", opacity: 0 }}
        />
        {/* UAP direction buttons: keyboard/touch alternative for moving the zoom cursor. */}
        <PortalOverlay track={cursorTrackRef} isDisabled={!inZoomSelection}>
          <DirectionButton
            direction="inline-start"
            state="active"
            show={inZoomSelection}
            ariaLabel={i18n.zoomCursorPreviousButtonAriaLabel}
            onClick={() => stepCursor(-1)}
            forcedPosition={null}
            forcedIndex={0}
          />
          <DirectionButton
            direction="inline-end"
            state="active"
            show={inZoomSelection}
            ariaLabel={i18n.zoomCursorNextButtonAriaLabel}
            onClick={() => stepCursor(1)}
            forcedPosition={null}
            forcedIndex={1}
          />
        </PortalOverlay>
      </>
    );
  },
);
