# `in` Operator Audit Findings — AWSUI-59006

## Repository: `cloudscape-design/chart-components`

**Audit date:** 2025-02-19
**GitHub base URL:** https://github.com/cloudscape-design/chart-components/tree/main/src

Related: [Tech proposal](./tech-proposal-in-operator-audit.md)

---

## Summary

| Metric | Count |
|--------|-------|
| Total `'prop' in obj` usages (source) | 12 |
| Category 1 — Union type discrimination | **0** |
| Category 2 — Runtime/feature detection | **12** |
| Test file usages | 1 |
| Type guards to create | **0** |
| Actionable items | **0** |

**All 12 usages are Category 2 and MUST stay as-is.** No code changes required.

---

## Detailed findings

### Usage #1: `"symbol" in series`

**File:** [`src/core/utils.ts:92`](https://github.com/cloudscape-design/chart-components/tree/main/src/core/utils.ts#L92)
**Function:** `getSeriesMarkerType()`
**Category:** 2 — Undocumented Highcharts property
**Why it must stay:** `Highcharts.Series.symbol` is not in the TS type definition but exists at runtime for scatter series markers.

```ts
// src/core/utils.ts, lines 88–96
export function getSeriesMarkerType(series?: Highcharts.Series): ChartSeriesMarkerType {
  if (!series) {
    return "large-square";
  }
  const seriesSymbol = "symbol" in series && typeof series.symbol === "string" ? series.symbol : "circle";
  // In Highcharts, dashStyle supports different types of dashes
  if ("dashStyle" in series.options && series.options.dashStyle && series.options.dashStyle !== "Solid") {
    return "dashed";
  }
```

---

### Usage #2: `"dashStyle" in series.options`

**File:** [`src/core/utils.ts:94`](https://github.com/cloudscape-design/chart-components/tree/main/src/core/utils.ts#L94)
**Function:** `getSeriesMarkerType()`
**Category:** 2 — Undocumented Highcharts property
**Why it must stay:** `dashStyle` exists on some Highcharts series types but not in the base `SeriesOptions` type.

```ts
// src/core/utils.ts, lines 94–96
  if ("dashStyle" in series.options && series.options.dashStyle && series.options.dashStyle !== "Solid") {
    return "dashed";
  }
```

---

### Usage #3: `"type" in series`

**File:** [`src/core/utils.ts:193`](https://github.com/cloudscape-design/chart-components/tree/main/src/core/utils.ts#L193)
**Function:** `getVisibleLegendItems()`
**Category:** 2 — Highcharts complex external union
**Why it must stay:** `Highcharts.SeriesOptionsType` is a union of 50+ series option types; `type` may or may not be explicitly present.

```ts
// src/core/utils.ts, lines 191–196
  options.series?.forEach((series) => {
    if (!("type" in series)) {
      return;
    }

    // The pie series is not shown in the legend. Instead, we show pie segments (points).
```

---

### Usage #4: `"xAxis" in item || "yAxis" in item`

**File:** [`src/core/utils.ts:208`](https://github.com/cloudscape-design/chart-components/tree/main/src/core/utils.ts#L208)
**Function:** `isSecondaryLegendItem()`
**Category:** 2 — Highcharts complex external union
**Why it must stay:** Duck-typing on `Highcharts.SeriesOptionsType | Highcharts.PointOptionsType` — external union not controlled by this codebase.

```ts
// src/core/utils.ts, lines 206–211
  // Only items that have an associated axis can be considered secondary
  if (item && typeof item === "object" && ("xAxis" in item || "yAxis" in item)) {
    const axisRef = isInverted ? (item.xAxis ?? 0) : (item.yAxis ?? 0);
    // An axis reference can be an index into the axes array or an explicitly passed id
    const valueAxis = typeof axisRef === "number" ? valueAxes[axisRef] : valueAxes.find((a) => a.id === axisRef);
    return valueAxis?.opposite ?? false;
```

---

### Usage #5: `"whiskers" in point`

**File:** [`src/core/utils.ts:275`](https://github.com/cloudscape-design/chart-components/tree/main/src/core/utils.ts#L275)
**Function:** `getErrorBarPointRect()`
**Category:** 2 — Undocumented Highcharts property
**Why it must stay:** `Highcharts.Point.whiskers` SVG element exists only on errorbar points at runtime, not in TS types.

```ts
// src/core/utils.ts, lines 272–278
function getErrorBarPointRect(point: Highcharts.Point): Rect {
  const chart = point.series.chart;
  if ("whiskers" in point) {
    return getChartRect((point.whiskers as Highcharts.SVGElement).getBBox(), chart, true);
  }
  return getPointRectFromCoordinates(point);
}
```

---

### Usage #6: `"plotLinesAndBands" in axis`

**File:** [`src/core/chart-api/chart-extra-highlight.ts:187`](https://github.com/cloudscape-design/chart-components/tree/main/src/core/chart-api/chart-extra-highlight.ts#L187)
**Function:** `iteratePlotLines()`
**Category:** 2 — Undocumented Highcharts property
**Why it must stay:** `Highcharts.Axis.plotLinesAndBands` array is explicitly not covered by TS types. The code has an inline comment: *"The Highcharts `Axis.plotLinesAndBands` API is not covered with TS."*

```ts
// src/core/chart-api/chart-extra-highlight.ts, lines 185–193
function iteratePlotLines(chart: Highcharts.Chart, cb: (lineId: string, line: Highcharts.PlotLineOrBand) => void) {
  chart.axes?.forEach((axis) => {
    // The Highcharts `Axis.plotLinesAndBands` API is not covered with TS.
    if ("plotLinesAndBands" in axis && Array.isArray(axis.plotLinesAndBands)) {
      axis.plotLinesAndBands.forEach((line: Highcharts.PlotLineOrBand) => {
        if (line.options.id) {
          cb(line.options.id, line);
        }
      });
```

---

### Usage #7: `"tooltipPos" in point`

**File:** [`src/core/chart-api/chart-extra-tooltip.tsx:208`](https://github.com/cloudscape-design/chart-components/tree/main/src/core/chart-api/chart-extra-tooltip.tsx#L208)
**Function:** `getPieChartTargetPlacement()`
**Category:** 2 — Undocumented Highcharts property
**Why it must stay:** `Highcharts.Point.tooltipPos` tuple exists only on pie series points at runtime, not in TS types. The code includes a fallback path for when this property is absent.

```ts
// src/core/chart-api/chart-extra-tooltip.tsx, lines 205–213
function getPieChartTargetPlacement(point: Highcharts.Point): Rect {
  // The pie series segments do not provide plotX, plotY to compute the tooltip placement.
  // Instead, there is a `tooltipPos` tuple, which is not covered by TS.
  // See: https://github.com/highcharts/highcharts/issues/23118.
  if ("tooltipPos" in point && Array.isArray(point.tooltipPos)) {
    return safeRect({ x: point.tooltipPos[0], y: point.tooltipPos[1], width: 0, height: 0 });
  }
  // We use the alternative, middle, tooltip placement as a fallback
  return getPieMiddlePlacement(point);
```

---

### Usage #8: `"data" in s.options`

**File:** [`src/core/chart-api/chart-extra-nodata.tsx:55`](https://github.com/cloudscape-design/chart-components/tree/main/src/core/chart-api/chart-extra-nodata.tsx#L55)
**Function:** `findAllSeriesWithData()`
**Category:** 2 — Highcharts complex external union
**Why it must stay:** Defensive check on `Highcharts.SeriesOptions` — `data` property may or may not be present depending on series type.

```ts
// src/core/chart-api/chart-extra-nodata.tsx, lines 53–57
function findAllSeriesWithData(chart: Highcharts.Chart) {
  return getChartSeries(chart.series).filter((s) => {
    const data = "data" in s.options && s.options.data && Array.isArray(s.options.data) ? s.options.data : [];
    return data.some((i) => i !== null && (typeof i === "object" && "y" in i ? i.y !== null : true));
  });
```

---

### Usage #9: `"y" in i`

**File:** [`src/core/chart-api/chart-extra-nodata.tsx:56`](https://github.com/cloudscape-design/chart-components/tree/main/src/core/chart-api/chart-extra-nodata.tsx#L56)
**Function:** `findAllSeriesWithData()`
**Category:** 2 — Highcharts complex external union
**Why it must stay:** Differentiating Highcharts data formats — data items can be `number | [number, number] | { y: number } | null`.

```ts
// src/core/chart-api/chart-extra-nodata.tsx, line 56
    return data.some((i) => i !== null && (typeof i === "object" && "y" in i ? i.y !== null : true));
```

---

### Usage #10: `"colorCounter" in chart`

**File:** [`src/core/chart-api/index.tsx:290`](https://github.com/cloudscape-design/chart-components/tree/main/src/core/chart-api/index.tsx#L290)
**Function:** `ChartAPI.resetColorCounter()` (private method)
**Category:** 2 — Undocumented Highcharts property
**Why it must stay:** `Highcharts.Chart.colorCounter` is an internal property used for color assignment. Part of a workaround for [Highcharts bug #23077](https://github.com/highcharts/highcharts/issues/23077).

```ts
// src/core/chart-api/index.tsx, lines 287–292
  private resetColorCounter() {
    const chart = this.context.chart();
    if ("colorCounter" in chart && typeof chart.colorCounter === "number") {
      chart.colorCounter = getChartSeries(chart.series).length;
    }
  }
```

---

### Usage #11: `"scrollTo" in element`

**File:** [`src/internal/utils/dom.ts:18`](https://github.com/cloudscape-design/chart-components/tree/main/src/internal/utils/dom.ts#L18)
**Function:** `scrollIntoViewNearestContainer()`
**Category:** 2 — Browser API feature detection
**Why it must stay:** `scrollTo` is not available in JSDOM test environments. Classic feature detection pattern.

```ts
// src/internal/utils/dom.ts, lines 16–20
  // Scroll methods (scrollTo, scrollIntoView, etc) are not supported in test environments like JSDOM.
  if (!("scrollTo" in element)) {
    return;
  }
```

---

### Usage #12: `"symbol" in series` (duplicate)

**File:** [`src/internal/components/series-marker/render-marker.tsx:82`](https://github.com/cloudscape-design/chart-components/tree/main/src/internal/components/series-marker/render-marker.tsx#L82)
**Function:** `getSeriesMarkerType()` (local to render-marker)
**Category:** 2 — Undocumented Highcharts property
**Why it must stay:** Same pattern as Usage #1 — undocumented `Highcharts.Series.symbol`, duplicate in a separate marker rendering module.

```ts
// src/internal/components/series-marker/render-marker.tsx, lines 80–84
function getSeriesMarkerType(series: Highcharts.Series): ChartSeriesMarkerType {
  const seriesSymbol = "symbol" in series && typeof series.symbol === "string" ? series.symbol : "circle";
  if (series.type === "scatter") {
    switch (seriesSymbol) {
```

---

### Test file usage: `"asymmetricMatch" in value`

**File:** [`src/core/__tests__/common.tsx:72`](https://github.com/cloudscape-design/chart-components/tree/main/src/core/__tests__/common.tsx#L72)
**Function:** `isJestMatcher()` (local helper in `objectContainingDeep`)
**Category:** 2 — Runtime Jest matcher detection
**Why it must stay:** `asymmetricMatch` is a Jest convention property not in any TS type.

```ts
// src/core/__tests__/common.tsx, lines 70–74
export function objectContainingDeep(root: object) {
  function isJestMatcher(value: object): boolean {
    return "asymmetricMatch" in value;
  }
  function transformLevel(obj: object) {
```

---

## Additional patterns found

| Pattern | Count | Location |
|---------|-------|----------|
| `for...in` loops | 0 | — |
| `Object.keys()` | 1 | [`src/internal/base-component/get-data-attributes.ts`](https://github.com/cloudscape-design/chart-components/tree/main/src/internal/base-component/get-data-attributes.ts) — iterating `data-*` attributes from props |
| `Object.entries()` | 1 | [`src/core/chart-api/chart-extra-navigation.ts`](https://github.com/cloudscape-design/chart-components/tree/main/src/core/chart-api/chart-extra-navigation.ts) — iterating element attributes for `setAttribute` |
| `hasOwnProperty` | 0 | — |