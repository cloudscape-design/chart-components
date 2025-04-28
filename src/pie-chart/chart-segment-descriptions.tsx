// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { renderToStaticMarkup } from "react-dom/server";
import type Highcharts from "highcharts";

import { InternalPieChartOptions, PieChartProps } from "./interfaces-pie";
import * as Styles from "./styles";

interface InternalPieChartProps extends Omit<PieChartProps, "series"> {
  highcharts: null | object;
  options: InternalPieChartOptions;
}

/**
 * The InternalPieChart component takes public PieChart properties, but also Highcharts options.
 * This allows using it as a Highcharts wrapper to mix Cloudscape and Highcharts features.
 */
export function useSegmentDescriptions(props: InternalPieChartProps) {
  const dataLabels: Highcharts.SeriesPieDataLabelsOptionsObject | Highcharts.SeriesPieDataLabelsOptionsObject[] = {
    position: "left",
    formatter() {
      if (!props.segmentOptions) {
        return null;
      }
      const { title: renderTitle, description: renderDescription } = props.segmentOptions;
      const segmentProps = {
        totalValue: this.total ?? 0,
        segmentValue: this.y ?? 0,
        segmentId: this.options.id,
        segmentName: this.options.name ?? "",
      };
      const title = renderTitle === null ? null : (renderTitle?.(segmentProps) ?? this.name);
      const description = renderDescription?.(segmentProps);
      if (title || description) {
        return renderToStaticMarkup(
          <text>
            {title ? <tspan>{this.name}</tspan> : null}
            <br />
            {description ? <tspan style={Styles.segmentDescriptionCss}>{description}</tspan> : null}
          </text>,
        );
      }
      return null;
    },
    useHTML: false,
  };
  return { dataLabels };
}
