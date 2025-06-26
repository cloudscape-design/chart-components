// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export class SVGRendererSingle {
  public element: null | Highcharts.SVGElement = null;

  public hide() {
    if (this.element && document.contains(this.element.element)) {
      this.element.attr({ class: undefined }).hide();
    } else {
      this.destroy();
    }
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
  private elements = {
    circle: [] as Highcharts.SVGElement[],
    rect: [] as Highcharts.SVGElement[],
    path: [] as Highcharts.SVGElement[],
  };
  private indices = { circle: 0, rect: 0, path: 0 };

  public hideAll() {
    for (const key of ["circle", "rect", "path"] as const) {
      this.elements[key] = this.elements[key].filter((element) => {
        if (!document.contains(element.element)) {
          element.destroy();
          return false;
        } else {
          element.attr({ class: undefined }).hide();
          return true;
        }
      });
      this.indices[key] = 0;
    }
  }

  public destroyAll() {
    for (const key of ["circle", "rect", "path"] as const) {
      this.elements[key].forEach((element) => element.destroy());
      this.elements[key] = [];
      this.indices[key] = 0;
    }
  }

  public circle(rr: Highcharts.SVGRenderer, attr: Highcharts.SVGAttributes): Highcharts.SVGElement {
    if (this.elements.circle[this.indices.circle]) {
      return this.elements.circle[this.indices.circle++].attr(attr).show();
    }
    const newCircle = rr.circle().add();
    this.elements.circle.push(newCircle);
    return this.circle(rr, attr);
  }

  public rect(rr: Highcharts.SVGRenderer, attr: Highcharts.SVGAttributes): Highcharts.SVGElement {
    if (this.elements.rect[this.indices.rect]) {
      return this.elements.rect[this.indices.rect++].attr(attr).show();
    }
    const newRect = rr.rect().add();
    this.elements.rect.push(newRect);
    return this.rect(rr, attr);
  }

  public path(rr: Highcharts.SVGRenderer, attr: Highcharts.SVGAttributes): Highcharts.SVGElement {
    if (this.elements.path[this.indices.path]) {
      return this.elements.path[this.indices.path++].attr(attr).show();
    }
    const newPath = rr.path().add();
    this.elements.path.push(newPath);
    return this.path(rr, attr);
  }
}
