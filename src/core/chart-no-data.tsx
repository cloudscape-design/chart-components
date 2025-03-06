// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useUniqueId } from "@dnd-kit/utilities";
import type Highcharts from "highcharts";

import LiveRegion from "@cloudscape-design/components/live-region";

import Portal from "../internal/components/portal";
import AsyncStore, { useSelector } from "../internal/utils/async-store";
import { ChartNoDataProps } from "./interfaces-core";
import * as Styles from "./styles";

// The custom no-data implementation relies on the Highcharts noData module.
// We render a custom empty DIV as `lang.noData` and then provide actual content using React portal.

export function useNoData(highcharts: null | typeof Highcharts, noDataProps?: ChartNoDataProps) {
  const noDataId = useUniqueId("no-data");
  const noDataStore = useMemo(() => new NoDataStore({ highcharts, noDataId }), [highcharts, noDataId]);
  const options: Highcharts.Options = {
    chart: {
      events: {
        render: noDataStore.onChartRender,
      },
    },
    noData: { position: Styles.noDataPosition, useHTML: true },
    lang: {
      noData: renderToStaticMarkup(<div style={Styles.noDataCss} id={noDataId}></div>),
    },
  };
  return { options, props: { ...noDataProps, noDataStore } };
}

export function ChartNoData({
  noDataStore,
  statusType = "finished",
  loading,
  empty,
  error,
  noMatch,
}: ChartNoDataProps & {
  noDataStore: AsyncStore<{ container: null | Element; noMatch: boolean }>;
}) {
  const state = useSelector(noDataStore, (s) => s);
  if (!state.container) {
    return null;
  }
  let content = null;
  if (statusType === "loading") {
    content = <LiveRegion>{loading}</LiveRegion>;
  } else if (statusType === "error") {
    content = <LiveRegion>{error}</LiveRegion>;
  } else if (state.noMatch) {
    content = noMatch;
  } else {
    content = empty;
  }
  return <Portal container={state.container}>{content}</Portal>;
}

class NoDataStore extends AsyncStore<{ container: null | Element; noMatch: boolean }> {
  private highcharts: null | typeof Highcharts;
  private noDataId: string;

  constructor({ highcharts, noDataId }: { highcharts: null | typeof Highcharts; noDataId: string }) {
    super({ container: null, noMatch: false });
    this.highcharts = highcharts;
    this.noDataId = noDataId;
  }

  public onChartRender: Highcharts.ChartRenderCallbackFunction = (event) => {
    if (this.highcharts && event.target instanceof this.highcharts.Chart) {
      const allSeries = event.target.series;
      const visibleSeries = allSeries.filter(
        (s) => s.visible && (s.type !== "pie" || s.data.some((d) => d.y !== null && d.visible)),
      );
      if (visibleSeries.length > 0) {
        this.set(() => ({ container: null, noMatch: false }));
      } else {
        // We use timeout to make sure the no-data container is rendered.
        setTimeout(() => {
          if (this.highcharts && event.target instanceof this.highcharts.Chart) {
            const noDataContainer = event.target.container.querySelector(`#${this.noDataId}`) as null | HTMLElement;
            if (noDataContainer) {
              noDataContainer.style.width = `${event.target.plotWidth}px`;
              noDataContainer.style.height = `${event.target.plotHeight}px`;
            }
            this.set(() => ({ container: noDataContainer, noMatch: allSeries.length > 0 }));
          }
        }, 0);
      }
    }
  };
}
