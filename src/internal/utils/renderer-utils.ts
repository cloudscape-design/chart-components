// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export class SVGRendererSingle {
  public element: null | Highcharts.SVGElement = null;

  public hide() {
    this.element?.hide();
  }

  public destroy() {
    this.element?.destroy();
    this.element = null;
  }

  public circle(rr: Highcharts.SVGRenderer, attr: Highcharts.SVGAttributes): Highcharts.SVGElement {
    if (!this.element) {
      this.element = rr.circle().add();
    }
    return this.element.attr(attr).show();
  }

  public rect(rr: Highcharts.SVGRenderer, attr: Highcharts.SVGAttributes): Highcharts.SVGElement {
    if (!this.element) {
      this.element = rr.rect().add();
    }
    return this.element.attr(attr).show();
  }

  public path(rr: Highcharts.SVGRenderer, attr: Highcharts.SVGAttributes): Highcharts.SVGElement {
    if (!this.element) {
      this.element = rr.path().add();
    }
    return this.element.attr(attr).show();
  }
}

export class SVGRendererPool {
  private circles: Highcharts.SVGElement[] = [];
  private circleIndex = 0;
  private rects: Highcharts.SVGElement[] = [];
  private rectIndex = 0;
  private paths: Highcharts.SVGElement[] = [];
  private pathIndex = 0;

  public hideAll() {
    this.circles.forEach((c) => c.hide());
    this.circleIndex = 0;
    this.rects.forEach((c) => c.hide());
    this.rectIndex = 0;
    this.paths.forEach((c) => c.hide());
    this.pathIndex = 0;
  }

  public destroyAll() {
    this.circles.forEach((c) => c.destroy());
    this.circles = [];
    this.rects.forEach((c) => c.destroy());
    this.rects = [];
    this.paths.forEach((c) => c.destroy());
    this.paths = [];
  }

  public circle(rr: Highcharts.SVGRenderer, attr: Highcharts.SVGAttributes): Highcharts.SVGElement {
    if (this.circles[this.circleIndex]) {
      return this.circles[this.circleIndex++].attr(attr).show();
    }
    const newCircle = rr.circle().add();
    this.circles.push(newCircle);
    return this.circle(rr, attr);
  }

  public rect(rr: Highcharts.SVGRenderer, attr: Highcharts.SVGAttributes): Highcharts.SVGElement {
    if (this.rects[this.rectIndex]) {
      return this.rects[this.rectIndex++].attr(attr).show();
    }
    const newRect = rr.rect().add();
    this.rects.push(newRect);
    return this.rect(rr, attr);
  }

  public path(rr: Highcharts.SVGRenderer, attr: Highcharts.SVGAttributes): Highcharts.SVGElement {
    if (this.paths[this.pathIndex]) {
      return this.paths[this.pathIndex++].attr(attr).show();
    }
    const newPath = rr.path().add();
    this.paths.push(newPath);
    return this.path(rr, attr);
  }
}
