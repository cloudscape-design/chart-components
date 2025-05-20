// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type Highcharts from "highcharts";

import { circleIndex, handleKey, KeyCode } from "@cloudscape-design/component-toolkit/internal";

import { Rect } from "../interfaces-core";
import * as Styles from "../styles";
import {
  findFirstPoint,
  findMatchedPointsByX,
  findNextPointByX,
  findNextPointInSeriesByX,
  getGroupRect,
  getPointRect,
} from "../utils";

export interface NavigationControllerHandlers {
  onFocusPoint(point: Highcharts.Point): void;
  onFocusX(point: Highcharts.Point): void;
  onBlur(): void;
  onActivatePoint(point: Highcharts.Point): void;
  onActivateX(point: Highcharts.Point): void;
}

export class NavigationController {
  private chart: null | Highcharts.Chart = null;
  private handlers: NavigationControllerHandlers;
  private focusOutline: null | FocusOutline = null;
  private focusCaptureEl: null | HTMLElement = null;
  private focusedX: null | number = null;
  private focusedPoint: null | Highcharts.Point = null;

  constructor(handlers: NavigationControllerHandlers) {
    this.handlers = handlers;
  }

  public init(chart: Highcharts.Chart) {
    this.chart = chart;
    this.focusOutline = new FocusOutline(chart);
  }

  private get safe() {
    if (!this.chart || !this.focusOutline) {
      throw new Error("Invariant violation: using chart API before initializing chart.");
    }
    return { chart: this.chart, focusOutline: this.focusOutline };
  }

  public setFocusCapture = (element: null | HTMLElement) => {
    if (this.focusCaptureEl) {
      this.focusCaptureEl.removeEventListener("focus", this.onFocusCaptureFocus);
      this.focusCaptureEl.removeEventListener("blur", this.onFocusCaptureBlur);
      this.focusCaptureEl.removeEventListener("keydown", this.onFocusCaptureKeyDown);
    }

    this.focusCaptureEl = element;

    if (this.focusCaptureEl) {
      this.focusCaptureEl.addEventListener("focus", this.onFocusCaptureFocus);
      this.focusCaptureEl.addEventListener("blur", this.onFocusCaptureBlur);
      this.focusCaptureEl.addEventListener("keydown", this.onFocusCaptureKeyDown);
    }
  };

  public focusCapture() {
    this.focusCaptureEl?.focus();
  }

  private onFocusCaptureFocus = () => {
    if (this.focusedPoint && this.focusedX) {
      this.focusNextX(0);
    } else if (this.focusedPoint) {
      this.focusNextY(0);
    } else {
      this.focusChart();
    }
  };

  private onFocusCaptureBlur = () => {
    this.safe.focusOutline.hide();
    this.handlers.onBlur();
  };

  private onFocusCaptureKeyDown = (event: KeyboardEvent) => {
    if (
      [
        KeyCode.up,
        KeyCode.down,
        KeyCode.left,
        KeyCode.right,
        KeyCode.enter,
        KeyCode.escape,
        KeyCode.home,
        KeyCode.end,
      ].includes(event.keyCode)
    ) {
      event.preventDefault();
    }
    if (this.focusedX !== null && this.focusedPoint !== null) {
      this.onFocusCaptureKeyDownX(event);
    } else if (this.focusedPoint !== null) {
      this.onFocusCaptureKeyDownPoint(event);
    } else {
      this.onFocusCaptureKeyDownChart(event);
    }
  };

  private onFocusCaptureKeyDownChart = (event: KeyboardEvent) => {
    handleKey(event as any, {
      onActivate: () => {
        this.focusNextX(1);
      },
      onInlineEnd: () => {
        this.focusNextX(1);
      },
      onInlineStart: () => {
        this.focusNextX(-1);
      },
      onBlockEnd: () => {
        this.focusNextX(1);
      },
      onBlockStart: () => {
        this.focusNextX(-1);
      },
    });
  };

  private onFocusCaptureKeyDownX = (event: KeyboardEvent) => {
    handleKey(event as any, {
      onActivate: () => {
        this.handlers.onActivateX(this.focusedPoint!);
      },
      onEscape: () => {
        this.focusedX = null;
        this.focusedPoint = null;
        this.focusChart();
      },
      onInlineEnd: () => {
        if (this.safe.chart.inverted) {
          this.focusNextY(0);
        } else {
          this.focusNextX(1);
        }
      },
      onInlineStart: () => {
        if (this.safe.chart.inverted) {
          this.focusNextY(0);
        } else {
          this.focusNextX(-1);
        }
      },
      onBlockEnd: () => {
        if (this.safe.chart.inverted) {
          this.focusNextX(1);
        } else {
          this.focusNextY(0);
        }
      },
      onBlockStart: () => {
        if (this.safe.chart.inverted) {
          this.focusNextX(-1);
        } else {
          this.focusNextY(0);
        }
      },
    });
  };

  private onFocusCaptureKeyDownPoint = (event: KeyboardEvent) => {
    handleKey(event as any, {
      onActivate: () => {
        this.handlers.onActivatePoint(this.focusedPoint!);
      },
      onEscape: () => {
        this.focusNextX(0);
      },
      onInlineEnd: () => {
        if (this.safe.chart.inverted) {
          this.focusNextY(-1);
        } else {
          this.focusNextPoint(1);
        }
      },
      onInlineStart: () => {
        if (this.safe.chart.inverted) {
          this.focusNextY(1);
        } else {
          this.focusNextPoint(-1);
        }
      },
      onBlockEnd: () => {
        if (this.safe.chart.inverted) {
          this.focusNextPoint(1);
        } else {
          this.focusNextY(-1);
        }
      },
      onBlockStart: () => {
        if (this.safe.chart.inverted) {
          this.focusNextPoint(-1);
        } else {
          this.focusNextY(1);
        }
      },
    });
  };

  private focusChart = () => {
    this.safe.focusOutline.showChartOutline();
  };

  private focusNextX = (direction: -1 | 0 | 1) => {
    if (this.safe.chart.series.some((s) => s.type === "pie")) {
      this.focusedPoint = this.focusedPoint
        ? findNextPointByX(this.focusedPoint, direction === 0 ? 1 : direction)
        : findFirstPoint(this.safe.chart, direction === 0 ? 1 : direction);
      return this.focusNextY(0);
    }
    if (direction === 0 && this.focusedPoint) {
      this.focusedX = this.focusedPoint.x;
    }
    if (direction === -1 || direction === 1) {
      this.focusedPoint = this.focusedPoint
        ? findNextPointByX(this.focusedPoint, direction)
        : findFirstPoint(this.safe.chart, direction);
      this.focusedX = this.focusedPoint.x;
    }
    if (this.focusedPoint) {
      const matchedPoints = findMatchedPointsByX(this.focusedPoint.series.chart.series, this.focusedPoint.x);
      this.safe.focusOutline.showXOutline(getGroupRect(matchedPoints));
      this.handlers.onFocusX(this.focusedPoint);
    }
  };

  private focusNextY = (direction: -1 | 0 | 1) => {
    if (direction === 0 && this.focusedX !== null) {
      const matched = findMatchedPointsByX(this.safe.chart.series, this.focusedX);
      this.focusedPoint = matched[0];
    }
    if ((direction === -1 || direction === 1) && this.focusedPoint) {
      const matched = findMatchedPointsByX(this.safe.chart.series, this.focusedPoint.x);
      const index = matched.indexOf(this.focusedPoint);
      const nextIndex = circleIndex(index + direction, [0, matched.length - 1]);
      this.focusedPoint = matched[nextIndex];
    }
    if (this.focusedPoint) {
      this.focusedX = null;
      this.safe.focusOutline.showPointOutline(getPointRect(this.focusedPoint));
      this.handlers.onFocusPoint(this.focusedPoint);
    }
  };

  private focusNextPoint = (direction: -1 | 1) => {
    if (this.focusedPoint) {
      this.focusedPoint = findNextPointInSeriesByX(this.focusedPoint, direction);
      this.safe.focusOutline.showPointOutline(getPointRect(this.focusedPoint));
      this.handlers.onFocusPoint(this.focusedPoint);
    }
  };
}

class FocusOutline {
  private chart: Highcharts.Chart;
  private refs: Highcharts.SVGElement[] = [];

  constructor(chart: Highcharts.Chart) {
    this.chart = chart;
  }

  public showChartOutline = () => {
    const [x, y, width, height] = [
      this.chart.plotLeft,
      this.chart.plotTop,
      this.chart.plotWidth,
      this.chart.plotHeight,
    ];
    this.showRectOutline({ x: x + 1, y: y + 1, width: width - 2, height: height - 2 });
  };

  public showXOutline = (rect: Rect) => {
    this.showRectOutline({ x: rect.x - 3, y: rect.y - 3, width: rect.width + 6, height: rect.height + 6 });
  };

  public showPointOutline = (rect: Rect) => {
    this.showRectOutline({ x: rect.x - 2, y: rect.y - 2, width: rect.width + 4, height: rect.height + 4 });
  };

  private showRectOutline = (rect: Rect) => {
    this.hide();
    this.refs.push(
      this.chart.renderer.rect(rect.x, rect.y, rect.width, rect.height).attr(Styles.navigationFocusOutlineStyle).add(),
    );
  };

  public hide() {
    this.refs.forEach((ref) => ref.destroy());
  }
}
