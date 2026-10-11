import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, effect, input, viewChild,
} from "@angular/core";
import * as echarts from "echarts/core";
import { CustomChart, LineChart } from "echarts/charts";
import {
  AxisPointerComponent, DataZoomComponent, GridComponent, MarkLineComponent, TitleComponent, TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

import { SITE_TIME_ZONE } from "../scene/sun";
import { Reading, STATUS_META, TrackerStatus, kmh, siteDateTime, statusSpans } from "../telemetry";

echarts.use([
  LineChart, CustomChart, GridComponent, TooltipComponent, TitleComponent, DataZoomComponent, AxisPointerComponent,
  MarkLineComponent, CanvasRenderer,
]);

// Validated as a set against the chart surface (dataviz validate_palette.js, dark, all pairs).
export const SERIES = {
  percent: { label: "Panel position", unit: "%", color: "#c98500" },
  temperature: { label: "Temperature", unit: "°C", color: "#d55181" },
  wind: { label: "Peak wind", unit: "km/h", color: "#3987e5" },
} as const;

const STATUS_ORDER: (TrackerStatus | null)[] = ["ACTIVE", "NIGHT", "SAFE", "AWAY", null];
const GAP_MS = 20 * 60 * 1000;
// Ink and type from the portal tokens (tracker.scss); axis text stays at 4.5:1 or more on the card.
const INK = { primary: "#f8fafc", secondary: "#94a3b8", muted: "#8492a6", grid: "rgba(148,163,184,0.12)" };
const FONT = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif";

const minuteLabel = new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIME_ZONE, hour: "numeric", minute: "2-digit" });
const hourLabel = new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIME_ZONE, hour: "numeric" });
const dayLabel = new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIME_ZONE, month: "short", day: "numeric" });

/** [t, value] pairs with a null wherever the data has a gap, so the line breaks there. */
function line(readings: Reading[], value: (r: Reading) => number | null): (number | null)[][] {
  const points: (number | null)[][] = [];
  readings.forEach((r, i) => {
    if (i > 0 && r.t - readings[i - 1].t > GAP_MS) points.push([readings[i - 1].t + 1, null]);
    points.push([r.t, value(r)]);
  });
  return points;
}

/** The reading closest to a time; readings are sorted ascending. */
function nearest(readings: Reading[], t: number): Reading | null {
  if (!readings.length) return null;
  let lo = 0, hi = readings.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (readings[mid].t < t) lo = mid + 1;
    else hi = mid;
  }
  const before = readings[Math.max(0, lo - 1)];
  const after = readings[lo];
  return Math.abs(before.t - t) < Math.abs(after.t - t) ? before : after;
}

@Component({
  selector: "tracker-history-chart",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #chart class="h-full w-full" role="img" [attr.aria-label]="summary()"></div>`,
  host: { class: "block" },
})
export class HistoryChartComponent implements AfterViewInit, OnDestroy {
  readonly readings = input.required<Reading[]>();
  readonly spanHours = input.required<number>();
  /** The right edge of the time axis (epoch ms); the left edge is spanHours before it. */
  readonly end = input.required<number>();
  readonly expanded = input(false);

  private readonly el = viewChild.required<ElementRef<HTMLElement>>("chart");
  private chart: echarts.ECharts | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(private readonly zone: NgZone) {
    effect(() => {
      // Read the inputs here so the effect re-runs when they change.
      const readings = this.readings();
      const spanHours = this.spanHours();
      const end = this.end();
      const expanded = this.expanded();
      if (this.chart) this.render(readings, spanHours, end, expanded);
    });
  }

  protected summary(): string {
    const readings = this.readings();
    if (!readings.length) return "No readings in this range";
    const last = readings[readings.length - 1];
    return `Panel position, temperature and peak wind over the ${this.spanHours() < 48 ? `${this.spanHours()} hour(s)` : `${this.spanHours() / 24} days`} up to the last sync. Latest: ${last.percent}% extended, ${last.temperature} °C.`;
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.chart = echarts.init(this.el().nativeElement, null, { renderer: "canvas" });
      this.resizeObserver = new ResizeObserver(() => {
        this.chart?.resize();
        this.render(this.readings(), this.spanHours(), this.end(), this.expanded());
      });
      this.resizeObserver.observe(this.el().nativeElement);
    });
    this.render(this.readings(), this.spanHours(), this.end(), this.expanded());
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.chart?.dispose();
  }

  private render(readings: Reading[], spanHours: number, end: number, expanded: boolean): void {
    const chart = this.chart;
    if (!chart) return;
    const height = this.el().nativeElement.clientHeight;
    const min = end - spanHours * 3_600_000;
    const labelFor = (t: number) =>
      (spanHours <= 1 ? minuteLabel : spanHours <= 24 ? hourLabel : dayLabel).format(t);

    // Small multiples, one measure each: they have different units, so they never share a y axis.
    const metrics = [
      { key: "percent" as const, value: (r: Reading) => r.percent, min: 0, max: 100 },
      { key: "temperature" as const, value: (r: Reading) => r.temperature },
      { key: "wind" as const, value: (r: Reading) => (r.windSensor ? Math.round(kmh(r.windMs) * 10) / 10 : null), min: 0 },
    ];
    const titleH = 24, gap = expanded ? 22 : 16, stripH = 12;
    const bottom = expanded ? 70 : 26;
    const fixed = 8 + titleH + stripH + gap + metrics.length * (titleH + gap) + bottom;
    const chartH = Math.max(56, (height - fixed) / metrics.length);

    const grids: object[] = [], xAxes: object[] = [], yAxes: object[] = [], titles: object[] = [], series: object[] = [];
    let y = 8;
    const addTitle = (text: string, color: string | null) => titles.push({
      text: color ? `{dot|●} ${text}` : text, left: 0, top: y,
      textStyle: { color: INK.secondary, fontFamily: FONT, fontSize: 12, fontWeight: 600, rich: { dot: { color: color ?? INK.muted, fontSize: 10 } } },
    });
    const addAxes = (top: number, h: number, last: boolean, yAxis: object) => {
      grids.push({ left: 34, right: 20, top, height: h });
      xAxes.push({
        type: "time", gridIndex: grids.length - 1, min, max: end,
        axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false },
        axisLabel: { show: last, color: INK.muted, fontFamily: FONT, fontSize: 12, hideOverlap: true, formatter: labelFor },
        axisPointer: { show: true, snap: false, label: { show: false }, lineStyle: { color: "rgba(255,255,255,0.35)", width: 1 } },
      });
      yAxes.push({ gridIndex: grids.length - 1, ...yAxis });
    };

    addTitle("Status", null);
    addAxes(y + titleH, stripH, false, { type: "value", show: false, min: 0, max: 1 });
    series.push({
      type: "custom", xAxisIndex: 0, yAxisIndex: 0, silent: true, clip: true,
      data: statusSpans(readings).map((s) => [s.start, s.end, STATUS_ORDER.indexOf(s.status)]),
      encode: { x: [0, 1] },
      renderItem: (_: unknown, api: { value: (i: number) => number; coord: (p: number[]) => number[]; size: (p: number[]) => number[] }) => {
        const start = api.coord([api.value(0), 1]);
        const end = api.coord([api.value(1), 0]);
        const status = STATUS_ORDER[api.value(2)];
        return {
          type: "rect",
          shape: { x: start[0], y: start[1], width: Math.max(1, end[0] - start[0] - 1), height: end[1] - start[1], r: 3 },
          style: { fill: status ? STATUS_META[status].color : "rgba(148,163,184,0.12)", opacity: status === "NIGHT" ? 0.55 : 0.9 },
        };
      },
    });
    y += titleH + stripH + gap;

    metrics.forEach((metric, i) => {
      const meta = SERIES[metric.key];
      addTitle(`${meta.label} (${meta.unit})`, meta.color);
      const index = grids.length;
      addAxes(y + titleH, chartH, i === metrics.length - 1, {
        type: "value", min: metric.min, max: metric.max, scale: metric.min === undefined, splitNumber: 2,
        axisLabel: { color: INK.muted, fontFamily: FONT, fontSize: 12 },
        splitLine: { lineStyle: { color: INK.grid } },
      });
      series.push({
        type: "line", name: meta.label, xAxisIndex: index, yAxisIndex: index,
        data: line(readings, metric.value), showSymbol: false, connectNulls: false, sampling: "lttb",
        lineStyle: { color: meta.color, width: 2 }, itemStyle: { color: meta.color },
        emphasis: { disabled: true },
        areaStyle: metric.key === "percent" ? {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(201,133,0,0.28)" }, { offset: 1, color: "rgba(201,133,0,0)" },
          ]),
        } : undefined,
        markLine: metric.key === "percent" ? {
          silent: true, symbol: "none", data: [{ yAxis: 50 }],
          lineStyle: { color: "rgba(255,255,255,0.18)", type: [3, 4], width: 1 },
          label: { formatter: "flat", color: INK.muted, fontFamily: FONT, fontSize: 11, position: "insideEndTop" },
        } : undefined,
      });
      y += titleH + chartH + gap;
    });

    const allX = grids.map((_, i) => i);
    chart.setOption({
      animation: false,
      textStyle: { fontFamily: FONT },
      title: titles,
      grid: grids,
      xAxis: xAxes,
      yAxis: yAxes,
      series,
      axisPointer: { link: [{ xAxisIndex: "all" }] },
      tooltip: {
        trigger: "axis",
        confine: true,
        backgroundColor: "rgba(27,35,54,0.97)",
        borderColor: "rgba(148,163,184,0.2)",
        padding: [10, 12],
        textStyle: { color: INK.primary, fontFamily: FONT, fontSize: 12 },
        extraCssText: "border-radius:12px;box-shadow:0 16px 40px rgba(2,6,23,0.55);backdrop-filter:blur(8px);",
        formatter: (params: { axisValue: number }[]) => {
          const r = nearest(readings, params[0]?.axisValue);
          if (!r) return "";
          const status = STATUS_META[r.status];
          const row = (color: string, label: string, value: string) =>
            `<div style="display:flex;gap:16px;justify-content:space-between;margin-top:4px"><span style="color:${INK.secondary}"><span style="color:${color}">●</span> ${label}</span><b style="font-variant-numeric:tabular-nums">${value}</b></div>`;
          return `<div style="color:${INK.secondary};margin-bottom:6px">${siteDateTime.format(r.t)}</div>`
            + `<div style="display:flex;align-items:center;gap:6px;font-weight:600"><span style="width:8px;height:8px;border-radius:9px;background:${status.color}"></span>${status.label}</div>`
            + row(SERIES.percent.color, "Panel", `${r.percent}%`)
            + row(SERIES.temperature.color, "Temp", `${r.temperature.toFixed(1)} °C`)
            + row(SERIES.wind.color, "Wind", r.windSensor ? `${kmh(r.windMs).toFixed(0)} km/h` : "sensor off");
        },
      },
      dataZoom: expanded ? [
        { type: "inside", xAxisIndex: allX, filterMode: "none" },
        {
          type: "slider", xAxisIndex: allX, filterMode: "none", bottom: 10, height: 24,
          borderColor: "rgba(148,163,184,0.16)", backgroundColor: "rgba(148,163,184,0.05)",
          fillerColor: "rgba(201,133,0,0.16)", dataBackground: { lineStyle: { color: "rgba(255,255,255,0.2)" }, areaStyle: { color: "rgba(255,255,255,0.05)" } },
          handleStyle: { color: "#c98500", borderColor: "#c98500" }, moveHandleStyle: { color: "rgba(201,133,0,0.5)" },
          textStyle: { color: INK.muted, fontFamily: FONT, fontSize: 11 }, labelFormatter: (t: number) => labelFor(t),
        },
      ] : [],
    }, { notMerge: true });
  }
}
