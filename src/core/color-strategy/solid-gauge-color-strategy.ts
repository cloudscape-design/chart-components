// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_COLOR } from "./constants";

/**
 * Determines the color for a solid gauge series based on its value and y-axis color stops configuration.
 * The color is calculated by interpolating between defined color stops on the y-axis.
 *
 * @param series - The Highcharts series object containing the gauge data
 * @returns A hex color string representing the appropriate color for the gauge value
 * @example
 * const color = getSolidGaugeSeriesColor(series);
 * // Returns a color like '#FF0000' based on the series value and y-axis stops
 */
export const getSolidGaugeSeriesColor = (series: Highcharts.Series): string => {
  const seriesYAxis = series.yAxis || (series.chart?.yAxis && series.chart.yAxis[0]);
  if (!seriesYAxis) {
    return DEFAULT_COLOR;
  }

  const dataValue = series.data[0]?.y;
  if (dataValue === null || dataValue === undefined) {
    return DEFAULT_COLOR;
  }

  const yAxisOptions = series.yAxis.options as Highcharts.YAxisOptions;
  return calculateColorFromStops({
    value: dataValue,
    stops: yAxisOptions.stops,
    min: seriesYAxis.min,
    max: seriesYAxis.max,
  });
};

/**
 * Calculates the color for a value based on the y-axis color stops configuration.
 * Uses color interpolation between stops for values that fall between defined stops.
 */
const calculateColorFromStops = ({
  value,
  stops,
  min = 0,
  max = 100,
}: {
  value?: number;
  stops: Highcharts.YAxisOptions["stops"];
  min?: number;
  max?: number;
}): string => {
  try {
    if (!stops?.length) {
      return DEFAULT_COLOR;
    }
    if (value === null || value === undefined) {
      return getFirstStopColor(stops);
    }

    const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));

    // Find the two stops to interpolate between
    for (let i = 0; i < stops.length - 1; i++) {
      const [pos1, color1] = stops[i] || [];
      const [pos2, color2] = stops[i + 1] || [];

      if (
        typeof pos1 === "number" &&
        typeof pos2 === "number" &&
        typeof color1 === "string" &&
        typeof color2 === "string" &&
        normalizedValue >= pos1 &&
        normalizedValue <= pos2
      ) {
        return interpolateColor(normalizedValue, [pos1, color1], [pos2, color2]);
      }
    }

    // If value is beyond the last stop, return the last stop color
    const lastStop = stops[stops.length - 1];
    if (lastStop && typeof lastStop[1] === "string") {
      const [lastPos, color] = lastStop;
      if (typeof lastPos === "number" && normalizedValue >= lastPos) {
        return color;
      }
    }

    return getFirstStopColor(stops);
  } catch {
    return DEFAULT_COLOR;
  }
};

/**
 * Interpolates between two colors based on a given value using linear interpolation (lerp).
 * The algorithm works by:
 * 1. Converting hex colors to RGB components
 * 2. Calculating the weighted average of each RGB component based on the ratio
 * 3. Converting the interpolated RGB values back to hex format
 *
 * For example, interpolating between red (#FF0000) and blue (#0000FF) at 0.5:
 * - R: 255 * (1-0.5) + 0 * 0.5 = 127
 * - G: 0 * (1-0.5) + 0 * 0.5 = 0
 * - B: 0 * (1-0.5) + 255 * 0.5 = 127
 * Results in #7F007F (purple)
 *
 * @param value - The normalized value between 0 and 1 to interpolate at
 * @param stop1 - The first color stop tuple containing [position, color]
 * @param stop2 - The second color stop tuple containing [position, color]
 * @returns A hex color string representing the interpolated color
 */
const interpolateColor = (value: number, stop1: [number, string], stop2: [number, string]): string => {
  const ratio = (value - stop1[0]) / (stop2[0] - stop1[0]);

  const hex1 = extractHexColor(stop1[1]);
  const hex2 = extractHexColor(stop2[1]);

  // Validate hex format is #RRGGBB
  if (!hex1.match(/^#[0-9A-F]{6}$/i) || !hex2.match(/^#[0-9A-F]{6}$/i)) {
    return DEFAULT_COLOR;
  }

  const r1 = parseInt(hex1.substring(1, 3), 16);
  const g1 = parseInt(hex1.substring(3, 5), 16);
  const b1 = parseInt(hex1.substring(5, 7), 16);

  const r2 = parseInt(hex2.substring(1, 3), 16);
  const g2 = parseInt(hex2.substring(3, 5), 16);
  const b2 = parseInt(hex2.substring(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
};

/**
 * Extracts a hex color code from a string that may contain CSS custom property format.
 * Handles three cases:
 * 1. CSS custom property with fallback: "var(--color-name, #hexcolor)" -> returns "#hexcolor"
 * 2. Direct hex color: "#hexcolor" -> returns "#hexcolor"
 * 3. Invalid input -> returns DEFAULT_COLOR
 *
 * @param color - The input color string to extract hex code from
 * @returns A hex color string in the format "#RRGGBB"
 * @example
 * extractHexColor("var(--primary, #FF0000)") // Returns "#FF0000"
 * extractHexColor("#00FF00") // Returns "#00FF00"
 * extractHexColor("invalid") // Returns DEFAULT_COLOR
 */
const extractHexColor = (color: string): string => {
  // Extract hex color from CSS custom property format: "var(--color-name, #hexcolor)"
  const match = color.match(/#[0-9a-fA-F]{6}/);
  return match ? match[0] : color.startsWith("#") ? color : DEFAULT_COLOR;
};

const getFirstStopColor = (stops: Highcharts.YAxisOptions["stops"]): string => {
  const [pos, color] = stops?.[0] || [];
  return typeof pos === "number" && typeof color === "string" ? color : DEFAULT_COLOR;
};
