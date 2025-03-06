// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface AreaSeries extends AbstractSeries {
  type: "area";
  data: (number | [number, number] | PointDataItem)[];
  marker?: PointMarker;
}

export interface AreaSplineSeries extends AbstractSeries {
  type: "areaspline";
  data: (number | [number, number] | PointDataItem)[];
  marker?: PointMarker;
}

export interface ColumnSeries extends AbstractSeries {
  type: "column";
  data: (null | number | [number, number | null] | PointDataItem)[];
}

export interface ErrorBarSeries extends AbstractSeries {
  type: "errorbar";
  data: ([number, number] | [number, number, number] | RangeDataItem)[];
}

export interface LineSeries extends AbstractSeries {
  type: "line";
  data: (number | [number, number] | PointDataItem)[];
  marker?: PointMarker;
}

export interface PieSeries extends AbstractSeries {
  type: "pie";
  innerSize?: string;
  data: PieDataItem[];
}

export interface DonutSeries extends AbstractSeries {
  type: "awsui-donut";
  data: PieDataItem[];
}

export interface ScatterSeries extends AbstractSeries {
  type: "scatter";
  data: (number | [number, number] | PointDataItem)[];
  marker?: PointMarker;
}

export interface SplineSeries extends AbstractSeries {
  type: "spline";
  data: (number | [number, number] | PointDataItem)[];
  marker?: PointMarker;
}

export interface TreeMapSeries extends AbstractSeries {
  type: "treemap";
  data: (number | TreeMapDataItem)[];
}

export interface XThresholdSeries extends AbstractSeries {
  type: "awsui-x-threshold";
  value: number;
  proximity?: number;
}

export interface YThresholdSeries extends AbstractSeries {
  type: "awsui-y-threshold";
  value: number;
}

// The data items are simpler versions of Highcharts.PointOptionsObject

export interface PieDataItem {
  y: number | null;
  id?: string;
  name: string;
  color?: string;
}

export interface PointDataItem {
  x: number;
  y: number;
  id?: string;
  name?: string;
  color?: string;
}

export interface RangeDataItem {
  x?: number;
  low: number;
  high: number;
  id?: string;
  name?: string;
  color?: string;
}

export interface TreeMapDataItem {
  value: number;
  id?: string;
  name: string;
  color?: string;
}

export interface AbstractSeries {
  id?: string;
  name: string;
  color?: string;
}

// The simpler version of Highcharts.PointMarkerOptionsObject
export interface PointMarker {
  color?: string;
  enabled?: boolean;
  enabledThreshold?: number;
  height?: number;
  width?: number;
  symbol?: "arc" | "callout" | "circle" | "diamond" | "square" | "triangle" | "triangle-down";
}
